import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ButtonModule } from "primeng/button";
import { PanelModule } from "primeng/panel";
import { MenuModule } from "primeng/menu";
import { ToastModule } from "primeng/toast";
import { CardModule } from "primeng/card";
import { ToggleButtonModule } from "primeng/togglebutton";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { PageHeaderComponent } from './home/page-header/page-header.component';
import {MenubarModule} from 'primeng/menubar';

@NgModule({
  declarations: [
    AppComponent,
    PageHeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ButtonModule,
    PanelModule,
    MenuModule,
    ToastModule,
    CardModule,
    ToggleButtonModule,
    FormsModule,
    InputTextModule,
    MenubarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
