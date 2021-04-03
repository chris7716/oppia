// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TranslationSuggestionReviewModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

describe('Translation Suggestion Review Modal Controller', function() {
  let $scope = null;
  let $uibModalInstance = null;
  let SiteAnalyticsService = null;
  let contributionAndReviewService = null;
  let contributionOpportunitiesService = null;
  let AlertsService = null;

  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $controller) {
    contributionAndReviewService = $injector.get(
      'ContributionAndReviewService');
    SiteAnalyticsService = $injector.get('SiteAnalyticsService');
    AlertsService = $injector.get('AlertsService');
    spyOn(
      SiteAnalyticsService,
      'registerContributorDashboardViewSuggestionForReview');
  }));

  describe('when reviewing suggestion', function() {
    const reviewable = true;
    const subheading = 'subheading_title';
    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      }
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      }
    };

    const suggestionIdToSuggestion = {
      suggestion_1: suggestion1,
      suggestion_2: suggestion2
    };
    beforeEach(angular.mock.inject(function($injector, $controller) {
      const $rootScope = $injector.get('$rootScope');
      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller('TranslationSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        initialSuggestionId: 'suggestion_1',
        subheading: subheading,
        reviewable: reviewable,
        suggestionIdToSuggestion: angular.copy(suggestionIdToSuggestion)
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.activeSuggestionId).toBe('suggestion_1');
        expect($scope.activeSuggestion).toEqual(suggestion1);
        expect($scope.subheading).toBe('subheading_title');
        expect($scope.reviewable).toBe(reviewable);
        expect($scope.reviewMessage).toBe('');
      });

    it('should register Contributor Dashboard view suggestion for review ' +
      'event after controller is initialized', function() {
      expect(
        SiteAnalyticsService
          .registerContributorDashboardViewSuggestionForReview)
        .toHaveBeenCalledWith('Translation');
    });

    it('should accept suggestion in suggestion modal service when clicking on' +
      ' accept and review next suggestion button', function() {
      expect($scope.activeSuggestionId).toBe('suggestion_1');
      expect($scope.activeSuggestion).toEqual(suggestion1);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');

      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          successCallback();
        });

      $scope.reviewMessage = 'Review message example';
      $scope.isTranslationUpdated = true;
      $scope.acceptAndReviewNext();

      expect($scope.activeSuggestionId).toBe('suggestion_2');
      expect($scope.activeSuggestion).toEqual(suggestion2);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');
      expect($scope.finalCommitMessage).toContain('-With Edits');
      expect(
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'accept', 'Review message example',
          'hint section of "StateName" card', $scope.showNextItemToReview,
          jasmine.any(Function));

      $scope.reviewMessage = 'Review message example 2';
      $scope.acceptAndReviewNext();
      expect(
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');

      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '2', 'suggestion_2', 'accept', 'Review message example 2',
          'hint section of "StateName" card', $scope.showNextItemToReview,
          jasmine.any(Function));
      expect($uibModalInstance.close).toHaveBeenCalledWith([
        'suggestion_1', 'suggestion_2']);
    });

    it('should reject suggestion in suggestion modal service when clicking on' +
      ' reject and review next suggestion button', function() {
      expect($scope.activeSuggestionId).toBe('suggestion_1');
      expect($scope.activeSuggestion).toEqual(suggestion1);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');

      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            callback) => {
          callback();
        });
      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardRejectSuggestion');

      $scope.reviewMessage = 'Review message example';
      $scope.rejectAndReviewNext();

      expect($scope.activeSuggestionId).toBe('suggestion_2');
      expect($scope.activeSuggestion).toEqual(suggestion2);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');
      expect(
        SiteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'reject', 'Review message example',
          'hint section of "StateName" card', $scope.showNextItemToReview);

      $scope.reviewMessage = 'Review message example 2';
      $scope.rejectAndReviewNext();

      expect(
        SiteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '2', 'suggestion_2', 'reject', 'Review message example 2',
          'hint section of "StateName" card', $scope.showNextItemToReview);
      expect($uibModalInstance.close).toHaveBeenCalledWith([
        'suggestion_1', 'suggestion_2']);
    });

    it('should reject a suggestion if the backend pre accept validation ' +
    'failed', function() {
      expect($scope.activeSuggestionId).toBe('suggestion_1');
      expect($scope.activeSuggestion).toEqual(suggestion1);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');
      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      spyOn(contributionAndReviewService, 'resolveSuggestionToExploration')
        .and.callFake((
            targetId, suggestionId, action, reviewMessage, commitMessage,
            successCallback, errorCallback) => {
          let dummyErrorResponse = {
            data: { error: 'Error!' }
          };
          if (errorCallback) {
            errorCallback(dummyErrorResponse);
          }
        });
      spyOn(AlertsService, 'addWarning');

      $scope.reviewMessage = 'Review message example';
      $scope.acceptAndReviewNext();

      expect(
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Translation');
      expect(contributionAndReviewService.resolveSuggestionToExploration)
        .toHaveBeenCalledWith(
          '1', 'suggestion_1', 'accept', 'Review message example',
          'hint section of "StateName" card', $scope.showNextItemToReview,
          jasmine.any(Function));
      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Invalid Suggestion: Error!');
    });

    it('should cancel suggestion in suggestion modal service when clicking on' +
    ' cancel suggestion button', function() {
      $scope.cancel();
      expect($uibModalInstance.close).toHaveBeenCalledWith([]);
    });

    it('should open the translation editor when the edit button is clicked',
      function() {
        $scope.editTranslate();
        expect($scope.isEditing).toBe(true);
      });

    it('should close the translation editor when the cancel button is clicked',
      function() {
        $scope.cancelEdit();
        expect($scope.isEditing).toBe(false);
      });

    it('should update translation when the update button is clicked',
      function() {
        $scope.activeSuggestion.suggestion_id = 'suggestion_1';
        $scope.editedContent.html = '<p>Test</p>';

        spyOn(contributionAndReviewService, 'updateTranslation')
          .and.callFake((
            suggestionId, updatedTranslation,
            successCallback, errorCallback) => {
            successCallback();
          });

        $scope.updateTranslate();

        expect(contributionAndReviewService.updateTranslation)
          .toHaveBeenCalledWith(
            'suggestion_1', '<p>Test</p>', jasmine.any(Function),
            jasmine.any(Function));
      });
  });

  describe('when viewing suggestion', function() {
    const reviewable = false;
    let $httpBackend = null;
    const subheading = 'subheading_title';

    const suggestion1 = {
      suggestion_id: 'suggestion_1',
      target_id: '1',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      },
      status: 'rejected'
    };
    const suggestion2 = {
      suggestion_id: 'suggestion_2',
      target_id: '2',
      suggestion_type: 'translate_content',
      change: {
        content_id: 'hint_1',
        content_html: 'Translation',
        translation_html: 'Tradução',
        state_name: 'StateName'
      }
    };

    const suggestionIdToSuggestion = {
      suggestion_1: suggestion1,
      suggestion_2: suggestion2
    };

    beforeEach(angular.mock.inject(function($injector, $controller) {
      const $rootScope = $injector.get('$rootScope');
      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);
      $httpBackend = $injector.get('$httpBackend');

      $scope = $rootScope.$new();
      $controller('TranslationSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        initialSuggestionId: 'suggestion_1',
        subheading: subheading,
        reviewable: reviewable,
        suggestionIdToSuggestion: angular.copy(suggestionIdToSuggestion)
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.activeSuggestionId).toBe('suggestion_1');
        expect($scope.activeSuggestion).toEqual(suggestion1);
        expect($scope.reviewable).toBe(reviewable);
        expect($scope.subheading).toBe('subheading_title');

        var messages = [{
          author_username: '',
          created_om_msecs: 0,
          entity_type: '',
          entity_id: '',
          message_id: '',
          text: '',
          updated_status: '',
          updated_subject: '',
        }];
        $httpBackend.expect('GET', '/threadhandler/' + 'suggestion_1').respond({
          messages: messages
        });
        $httpBackend.flush();

        expect($scope.reviewMessage).toBe('');
      });
  });
});
