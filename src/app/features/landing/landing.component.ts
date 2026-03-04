import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * LandingComponent — Public marketing landing page.
 *
 * Sections: Hero, Features, App Preview (CSS mockups), Permission Matrix, CTA, Footer.
 * Accessible without authentication. Redirects authenticated users to /dashboard.
 */
@Component({
    selector: 'app-landing',
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

    /** Controls sticky-header shadow after scroll */
    isScrolled = false;

    /** Mobile nav open state */
    mobileNavOpen = false;

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        // If already logged in, skip the landing page and go straight to the app
        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/dashboard']);
        }
    }

    /**
     * Listen to window scroll to add shadow effect to the navbar.
     */
    @HostListener('window:scroll')
    onScroll(): void {
        this.isScrolled = window.scrollY > 20;
    }

    /**
     * Smooth-scroll to an anchor section by ID.
     * @param id - The element ID to scroll to
     */
    scrollTo(id: string): void {
        this.mobileNavOpen = false;
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Switch the active preview tab (kanban | tasks | dash).
     * Toggles .active class on tab buttons and .hidden on screens.
     *
     * @param tab   - Tab identifier: 'kanban' | 'tasks' | 'dash'
     * @param event - Click event (used to target the clicked button)
     */
    setTab(tab: string, event: MouseEvent): void {
        // Update button active states
        document.querySelectorAll('.land-tab').forEach(el => el.classList.remove('active'));
        (event.currentTarget as HTMLElement).classList.add('active');
        // Show/hide the corresponding screen panel
        ['kanban', 'tasks', 'dash'].forEach(t => {
            const el = document.getElementById(`screen-${t}`);
            if (el) { el.classList.toggle('hidden', t !== tab); }
        });
    }

    /** Navigate to the login page */
    goToLogin(): void {
        this.router.navigate(['/auth/login']);
    }

    /** Navigate to the register page */
    goToRegister(): void {
        this.router.navigate(['/auth/register']);
    }
}
