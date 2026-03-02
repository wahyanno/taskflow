import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';

/**
 * ProjectsModule - Lazy-loaded module untuk manajemen project
 *
 * Routes:
 * /projects       → ProjectListComponent (list semua project)
 * /projects/:id   → ProjectDetailComponent (detail + tasks)
 */
const routes: Routes = [
  { path: '', component: ProjectListComponent },
  { path: ':id', component: ProjectDetailComponent },
];

@NgModule({
  declarations: [
    ProjectListComponent,
    ProjectDetailComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ProjectsModule { }
