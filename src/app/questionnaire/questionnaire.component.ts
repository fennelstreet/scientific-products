import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { DeviceService } from '../services/device.service';

interface QuestionnaireHistoryEntry {
  questionIndex: number;
  remainingDevices: string[];
}

@Component({
  selector: 'app-questionnaire',
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class QuestionnaireComponent implements OnInit {
  questionKeys: string[] = [];
  remainingDevices: string[] = [];
  currentQuestionIndex = 0;
  currentSelections: string[] = [];
  history: QuestionnaireHistoryEntry[] = [];
  isLoading = true;
  errorMessage = '';
  searchFilter = '';
  dropdownOpen = false;
  showAllResults = false;

  constructor(private readonly deviceService: DeviceService) {}

  ngOnInit(): void {
    this.deviceService.loadDevices().subscribe({
      next: () => {
        this.questionKeys = this.deviceService.getQuestionKeys();
        this.restartQuestionnaire();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load device data right now.';
        this.isLoading = false;
      }
    });
  }

  get currentQuestionKey(): string {
    return this.questionKeys[this.currentQuestionIndex] ?? '';
  }

  get availableAnswers(): string[] {
    return this.currentQuestionKey
      ? this.deviceService.getAvailableAnswers(this.currentQuestionKey, this.remainingDevices)
      : [];
  }

  get filteredAnswers(): string[] {
    const filter = this.searchFilter.toLowerCase().trim();
    if (!filter) {
      return this.availableAnswers;
    }
    return this.availableAnswers.filter((answer) => answer.toLowerCase().includes(filter));
  }

  get isSingleSelectQuestion(): boolean {
    return this.currentQuestionKey
      ? this.deviceService.isSingleSelectQuestion(this.currentQuestionKey)
      : false;
  }

  get canGoBack(): boolean {
    return this.history.length > 0;
  }

  get isComplete(): boolean {
    return !this.isLoading && (
      this.currentQuestionIndex >= this.questionKeys.length ||
      this.remainingDevices.length <= 1
    );
  }

  get displayedDevices(): string[] {
    return this.showAllResults ? this.remainingDevices : this.remainingDevices.slice(0, 3);
  }

  get progressPercent(): number {
    if (!this.questionKeys.length) return 0;
    if (this.isComplete) return 100;
    return (this.currentQuestionIndex / this.questionKeys.length) * 100;
  }

  isSelected(answer: string): boolean {
    return this.currentSelections.includes(answer);
  }

  toggleSelection(answer: string, checked: boolean): void {
    if (checked) {
      this.currentSelections = [...this.currentSelections, answer];
      return;
    }

    this.currentSelections = this.currentSelections.filter((selectedAnswer) => selectedAnswer !== answer);
  }

  selectSingleAnswer(answer: string): void {
    this.currentSelections = [answer];
    this.submitCurrentAnswer();
  }

  submitCurrentAnswer(): void {
    if (!this.currentQuestionKey || !this.currentSelections.length) {
      return;
    }

    this.history.push({
      questionIndex: this.currentQuestionIndex,
      remainingDevices: [...this.remainingDevices]
    });

    this.remainingDevices = this.deviceService.filterDevices(
      this.remainingDevices,
      this.currentQuestionKey,
      this.currentSelections
    );
    this.currentQuestionIndex += 1;
    this.currentSelections = [];
    this.searchFilter = '';
    this.dropdownOpen = false;
  }

  goBack(): void {
    const previousState = this.history.pop();

    if (!previousState) {
      return;
    }

    this.currentQuestionIndex = previousState.questionIndex;
    this.remainingDevices = [...previousState.remainingDevices];
    this.currentSelections = [];
    this.searchFilter = '';
    this.dropdownOpen = false;
  }

  trackByAnswer(_index: number, answer: string): string {
    return `${this.currentQuestionIndex}_${answer}`;
  }

  restartQuestionnaire(): void {
    this.questionKeys = this.deviceService.getQuestionKeys();
    this.remainingDevices = this.deviceService.getAllDeviceNames();
    this.currentQuestionIndex = 0;
    this.currentSelections = [];
    this.history = [];
    this.errorMessage = '';
    this.showAllResults = false;
  }
}
