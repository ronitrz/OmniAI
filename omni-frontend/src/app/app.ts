import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkspaceStateService } from './core/services/workspace-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('omni-frontend');
  private state = inject(WorkspaceStateService);

  ngOnInit(): void {
    this.state.initTheme();
  }
}
