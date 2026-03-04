import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing.component';

/**
 * LandingModule — Lazy-loaded module for the public marketing landing page.
 * Route: /  (root path)
 */
const routes: Routes = [
    { path: '', component: LandingComponent }
];

@NgModule({
    declarations: [LandingComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes)
    ]
})
export class LandingModule { }
