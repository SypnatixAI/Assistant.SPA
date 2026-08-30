import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, concatMap, forkJoin, from, map, of, toArray } from 'rxjs';

import { Microsoft365ApiService } from '../../../../core/services/api/microsoft365-api.service';
import { ApplicationNavigationService } from '../../../../core/services/navigation/application-navigation.service';
import { ApiError } from '../../../../domain/errors/api-error';
import {
  Microsoft365Drive,
  Microsoft365List,
  Microsoft365OnboardingStatus,
  Microsoft365Site,
} from '../../../../domain/microsoft365/microsoft365';

type ConsentOutcome = 'success' | 'error' | null;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-microsoft365-administration-page',
  styleUrl: './microsoft365-administration-page.css',
  templateUrl: './microsoft365-administration-page.html',
})
export class Microsoft365AdministrationPage {
  protected readonly consentOutcome: ConsentOutcome;
  protected readonly currentStep = computed(() => {
    const status = this.onboardingStatus();
    if (!status?.isConsentComplete) {
      return 1;
    }
    if (!status.hasSelectedSite) {
      return 2;
    }
    return 3;
  });
  protected readonly drives = signal<readonly Microsoft365Drive[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hasSitesLoadError = signal(false);
  protected readonly isLoadingSites = signal(false);
  protected readonly isLoadingSources = signal(false);
  protected readonly isLoadingStatus = signal(true);
  protected readonly isOnboardingMode: boolean;
  protected readonly isSelectingSite = signal(false);
  protected readonly isStartingConsent = signal(false);
  protected readonly lists = signal<readonly Microsoft365List[]>([]);
  protected readonly onboardingStatus =
    signal<Microsoft365OnboardingStatus | null>(null);
  protected readonly pendingSiteIds = signal<ReadonlySet<string>>(new Set());
  protected readonly pendingSiteCount = computed(
    () => this.pendingSiteIds().size,
  );
  protected readonly selectedSite = signal<Microsoft365Site | null>(null);
  protected readonly sites = signal<readonly Microsoft365Site[]>([]);
  protected readonly updatingSourceIds = signal<ReadonlySet<string>>(new Set());

  constructor(
    route: ActivatedRoute,
    private readonly microsoft365ApiService: Microsoft365ApiService,
    private readonly navigationService: ApplicationNavigationService,
  ) {
    const outcome = route.snapshot.data['consentOutcome'];
    this.consentOutcome =
      outcome === 'success' || outcome === 'error' ? outcome : null;
    this.isOnboardingMode = route.snapshot.data['onboardingMode'] === true;
    this.loadStatus();
  }

  protected isStepComplete(step: number): boolean {
    return this.currentStep() > step;
  }

  protected isStepLocked(step: number): boolean {
    return this.currentStep() < step;
  }

  protected startConsent(): void {
    this.isStartingConsent.set(true);
    this.errorMessage.set(null);
    this.microsoft365ApiService.startConsent().subscribe({
      next: ({ authorizationUrl }) =>
        this.navigationService.navigateToExternalHttpsUrl(authorizationUrl),
      error: (error: unknown) => {
        this.isStartingConsent.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  protected refresh(): void {
    this.errorMessage.set(null);
    this.loadStatus();
  }

  protected chooseSite(site: Microsoft365Site): void {
    if (!this.onboardingStatus()?.isAdministrator) {
      return;
    }

    this.errorMessage.set(null);
    if (site.isSelected) {
      this.selectedSite.set(site);
      if (!this.isOnboardingMode) {
        this.loadSources(site.siteId);
      }
      return;
    }

    this.isSelectingSite.set(true);
    this.microsoft365ApiService.selectSite(site.siteId).subscribe({
      next: () => {
        const selectedSite = { ...site, isSelected: true };
        this.sites.update((sites) =>
          sites.map((candidate) =>
            candidate.siteId === site.siteId ? selectedSite : candidate,
          ),
        );
        this.selectedSite.set(selectedSite);
        this.onboardingStatus.update((status) =>
          status === null
            ? null
            : { ...status, hasSelectedSite: true, isComplete: true },
        );
        this.isSelectingSite.set(false);
        if (!this.isOnboardingMode) {
          this.loadSources(site.siteId);
        }
      },
      error: (error: unknown) => {
        this.isSelectingSite.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  protected isSitePending(siteId: string): boolean {
    return this.pendingSiteIds().has(siteId);
  }

  protected togglePendingSite(site: Microsoft365Site): void {
    if (
      site.isSelected ||
      this.isSelectingSite() ||
      !this.onboardingStatus()?.isAdministrator
    ) {
      return;
    }

    this.errorMessage.set(null);
    this.pendingSiteIds.update((current) => {
      const updated = new Set(current);
      if (updated.has(site.siteId)) {
        updated.delete(site.siteId);
      } else {
        updated.add(site.siteId);
      }
      return updated;
    });
  }

  protected confirmSiteSelection(): void {
    const siteIds = [...this.pendingSiteIds()];
    if (siteIds.length === 0 || this.isSelectingSite()) {
      return;
    }

    this.isSelectingSite.set(true);
    this.errorMessage.set(null);
    from(siteIds).pipe(
      concatMap((siteId) =>
        this.microsoft365ApiService.selectSite(siteId).pipe(
          map((site) => ({ error: null, site })),
          catchError((error: unknown) => of({ error, site: null })),
        ),
      ),
      toArray(),
    ).subscribe((results) => {
      const selectedSites = results.flatMap((result) =>
        result.site === null ? [] : [result.site],
      );
      const selectedSiteIds = new Set(
        selectedSites.map((site) => site.siteId),
      );
      this.sites.update((sites) =>
        sites.map((site) =>
          selectedSiteIds.has(site.siteId)
            ? { ...site, isSelected: true }
            : site,
        ),
      );
      this.pendingSiteIds.set(
        new Set(siteIds.filter((siteId) => !selectedSiteIds.has(siteId))),
      );
      this.selectedSite.set(selectedSites[0] ?? this.selectedSite());
      this.isSelectingSite.set(false);

      const failedResult = results.find((result) => result.error !== null);
      if (selectedSites.length > 0 && failedResult === undefined) {
        this.onboardingStatus.update((status) =>
          status === null
            ? null
            : { ...status, hasSelectedSite: true, isComplete: true },
        );
      }

      if (failedResult !== undefined) {
        this.errorMessage.set(this.getErrorMessage(failedResult.error));
      }
    });
  }

  protected toggleDrive(drive: Microsoft365Drive): void {
    const sourceKey = `drive:${drive.driveId}`;
    this.markSourceUpdating(sourceKey, true);
    this.microsoft365ApiService
      .setDriveIndexed(drive.siteId, drive.driveId, !drive.isIndexed)
      .subscribe({
        next: (updatedDrive) => {
          this.drives.update((drives) =>
            drives.map((candidate) =>
              candidate.driveId === updatedDrive.driveId
                ? updatedDrive
                : candidate,
            ),
          );
          this.markSourceUpdating(sourceKey, false);
          this.refreshProgress();
        },
        error: (error: unknown) => {
          this.markSourceUpdating(sourceKey, false);
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }

  protected toggleList(list: Microsoft365List): void {
    const sourceKey = `list:${list.listId}`;
    this.markSourceUpdating(sourceKey, true);
    this.microsoft365ApiService
      .setListIndexed(list.siteId, list.listId, !list.isIndexed)
      .subscribe({
        next: (updatedList) => {
          this.lists.update((lists) =>
            lists.map((candidate) =>
              candidate.listId === updatedList.listId ? updatedList : candidate,
            ),
          );
          this.markSourceUpdating(sourceKey, false);
          this.refreshProgress();
        },
        error: (error: unknown) => {
          this.markSourceUpdating(sourceKey, false);
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }

  protected finishOnboarding(): void {
    this.navigationService.navigateToChat();
  }

  private loadStatus(): void {
    this.isLoadingStatus.set(true);
    this.microsoft365ApiService.getOnboardingStatus().subscribe({
      next: (status) => {
        this.onboardingStatus.set(status);
        this.isLoadingStatus.set(false);

        if (
          status.isComplete &&
          this.isOnboardingMode &&
          this.consentOutcome === null
        ) {
          this.navigationService.navigateToChat();
          return;
        }

        if (status.isConsentComplete && status.isAdministrator) {
          this.loadSites();
        }
      },
      error: (error: unknown) => {
        this.isLoadingStatus.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  private refreshProgress(): void {
    this.microsoft365ApiService.getOnboardingStatus().subscribe({
      next: (status) => this.onboardingStatus.set(status),
      error: (error: unknown) =>
        this.errorMessage.set(this.getErrorMessage(error)),
    });
  }

  private loadSites(): void {
    this.isLoadingSites.set(true);
    this.hasSitesLoadError.set(false);
    this.microsoft365ApiService.getSites().subscribe({
      next: ({ sites }) => {
        this.sites.set(sites);
        this.pendingSiteIds.set(new Set());
        this.isLoadingSites.set(false);
        const selectedSite = sites.find((site) => site.isSelected) ?? null;
        this.selectedSite.set(selectedSite);
        if (selectedSite !== null) {
          this.loadSources(selectedSite.siteId);
        }
      },
      error: (error: unknown) => {
        this.isLoadingSites.set(false);
        this.hasSitesLoadError.set(true);
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  private loadSources(siteId: string): void {
    this.isLoadingSources.set(true);
    this.drives.set([]);
    this.lists.set([]);
    forkJoin({
      drives: this.microsoft365ApiService.getDrives(siteId),
      lists: this.microsoft365ApiService.getLists(siteId),
    }).subscribe({
      next: ({ drives, lists }) => {
        this.drives.set(drives);
        this.lists.set(lists.lists);
        this.isLoadingSources.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingSources.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      },
    });
  }

  private markSourceUpdating(sourceKey: string, isUpdating: boolean): void {
    this.updatingSourceIds.update((current) => {
      const updated = new Set(current);
      if (isUpdating) {
        updated.add(sourceKey);
      } else {
        updated.delete(sourceKey);
      }
      return updated;
    });
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof ApiError
      ? error.message
      : 'La configuration Microsoft 365 n’a pas pu être chargée.';
  }
}
