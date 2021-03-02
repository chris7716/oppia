// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the FractionInput response.
 */
import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { FractionAnswer } from 'interactions/answer-defs';
import { HtmlEscaperService } from 'services/html-escaper.service';

@Component({
  selector: 'oppia-response-fraction-input',
  templateUrl: './fraction-input-response.component.html',
  styleUrls: []
})
export class ResponseFractionInput {
  @Input() answer: string = '';
  escapedAnswer: string = '';

  constructor(
    private readonly htmlEscaperService: HtmlEscaperService,
    private readonly fractionObjectFactory: FractionObjectFactory) {}

  ngOnInit(): void {
    const fraction: FractionAnswer = (
      this.htmlEscaperService.escapedJsonToObj(this.answer) as FractionAnswer);
    this.escapedAnswer = this.fractionObjectFactory.fromDict(
      fraction).toString();
  }
}

angular.module('oppia').directive(
  'oppiaResponseFractionInput', downgradeComponent({
    component: ResponseFractionInput
  }) as angular.IDirectiveFactory);
