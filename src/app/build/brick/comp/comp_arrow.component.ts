import { Component, Input } from '@angular/core';

import { Comp, ComponentAttempt } from '../../../schema';
import { register } from './comp_index';
import { CompComponent } from "./comp.component";
import { MAT_CHECKBOX_CLICK_ACTION } from '@angular/material/checkbox';

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export class CompArrow extends Comp {
    name = "Arrow";
    data: { categories: { choices: string[] }[], reveal: string }

    constructor(data: { categories: { choices: string[] }[], reveal:string }) {
        super();
        this.data = data;
    }
}

@register("Arrow")
@Component({
    selector: 'sort',
    template: `
    <div class="arrow-big-container" fxLayout="row">
        <div *ngFor="let cat of userCats; let i = index" class="arrow-container" fxFlex="1 0 25%" fxLayout="row">
            <mat-list [dragula]="'DRAG'+i" [(dragulaModel)]="userCats[i].choices" class="arrow-list" fxFlex="1 0 0">
                <mat-list-item class="touch-list-item" *ngFor="let item of cat.choices; let ind = index" fxLayout="row" fxLayoutAlign="space-around center">
                    <mat-checkbox *ngIf="i == 0 && attempt" [checked]="getState(ind) == 1" [indeterminate]="getState(ind) == -1" disabled></mat-checkbox>
                    <div *ngIf="i == 0 && attempt">{{ data.data.reveals[getChoice(item)] }}</div>
                    <div fxFlex="1 0 0"></div>
                    <div class="arrow-item-text">{{item}}</div>
                    <div fxFlex="1 0 0"></div>
                </mat-list-item>
            </mat-list>
            <!-- Arrow Graphics -->
            <mat-list *ngIf="i + 1 != userCats.length">
                <mat-list-item *ngFor="let item of cat.choices">
                    <mat-icon class="material-icons arrow-icon">arrow_right_alt</mat-icon>
                </mat-list-item>
            </mat-list>
        <div>
    </div>
    `,
    styleUrls: ['../live.component.scss'],
    providers: [
        {provide: MAT_CHECKBOX_CLICK_ACTION, useValue: 'noop'}
    ]
})
export class ArrowComponent extends CompComponent {
    @Input() data: CompArrow;

    userCats: { choices: string[] }[];

    ngOnInit() {
        this.userCats = this.data.data.categories.map((cat) => { return { choices: shuffle(cat.choices.slice()) }});
        if(this.attempt) {
            this.userCats = [];
            this.attempt.answer[0].choice.forEach((choice, index) => {
                this.userCats.push({ choices: [] });
            })
            this.userCats = this.userCats.map((cat, index) => {
                return {
                    choices: this.attempt.answer.map((choice, i) => {
                        return this.data.data.categories[index].choices[choice.choice[index]];
                    })
                };
            })
        }
    }

    getAnswer() : { choice: number[] }[] {
        var choices: { choice: number[] }[] = [];
        this.userCats[0].choices.forEach((choice, index) => {
            choices.push({ choice: this.userCats.map((cat, i) => { return this.data.data.categories[i].choices.indexOf(cat.choices[index]) }) })
        });
        return choices;
    }

    getChoice(choice) {
        return this.data.data.categories[0].choices.indexOf(choice);
    }

    getState(index: number) : number {
        let corr = this.attempt.answer[index].choice.every((ch, ind) => {
            return ch == this.attempt.answer[index].choice[0];
        })
        if(corr) {
            return 1;
        } else {
            return -1;
        }
    }

    mark(attempt: ComponentAttempt, prev: ComponentAttempt) : ComponentAttempt {
        // If the question is answered in review phase, add 2 to the mark and not 5.
        let markIncrement = prev ? 2 : 5;
        attempt.correct = true;
        attempt.marks = 0;
        attempt.maxMarks = 0;
        attempt.answer
            // Map every answer to its choice,
            .map(c => c.choice)
            // and for every answer...
            .forEach((c, i) => {
                // increase the maximum marks by 5,
                attempt.maxMarks += 5;
                // set 'corr' to true if every option is equal,
                let corr = c.every(opt => opt == c[0]);
                // and if the answer is correct...
                if(corr) {
                    // and the program is the live phase...
                    if(!prev) {
                        // increase the marks by 5.
                        attempt.marks += markIncrement;
                    }
                    // or if the answer given in the live phase is also correct...
                    else if(!prev.answer[i].choice.every(opt => opt == prev.answer[i].choice[0])) {
                        // increase the marks by 2.
                        attempt.marks += markIncrement;
                    }
                }
                // if not...
                else {
                    // the answer is not correct.
                    attempt.correct = false;
                }
            });
        // Then, if the attempt scored no marks and the program is in live phase, then give the student a mark.
        if(attempt.marks == 0 && !prev) attempt.marks = 1;
        return attempt;
    }
}
