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
 * @fileoverview Controller for translation suggestion review modal.
 */

import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';

require('services/alerts.service.ts');
require('services/site-analytics.service.ts');
require('services/suggestion-modal.service.ts');

angular.module('oppia').controller(
  'TranslationSuggestionReviewModalController', [
    '$http', '$scope', '$uibModalInstance', 'AlertsService',
    'ContributionAndReviewService', 'ContributionOpportunitiesService',
    'SiteAnalyticsService', 'UrlInterpolationService',
    'initialSuggestionId', 'reviewable', 'subheading',
    'suggestionIdToSuggestion', 'ACTION_ACCEPT_SUGGESTION',
    'ACTION_REJECT_SUGGESTION',
    function(
        $http, $scope, $uibModalInstance, AlertsService,
        ContributionAndReviewService, ContributionOpportunitiesService,
        SiteAnalyticsService, UrlInterpolationService,
        initialSuggestionId, reviewable, subheading, suggestionIdToSuggestion,
        ACTION_ACCEPT_SUGGESTION, ACTION_REJECT_SUGGESTION) {
      var resolvedSuggestionIds = [];
      $scope.reviewable = reviewable;
      $scope.activeSuggestionId = initialSuggestionId;
      $scope.activeSuggestion = suggestionIdToSuggestion[
        $scope.activeSuggestionId];
      $scope.subheading = subheading;
      $scope.startedEditing = false;
      $scope.translationUpdated = false;
      $scope.HTML_SCHEMA = {
        type: 'html',
        ui_config: {
          hide_complex_extensions: 'true'
        }
      };
      $scope.editedContent = {
        html: ''
      };

      $scope. updateSuggestion = function() {
        const updatedTranslation = $scope.editedContent.html;
        const suggestionId = $scope.activeSuggestion.suggestion_id;
        ContributionAndReviewService.updateTranslationSuggestion(
          suggestionId,
          updatedTranslation,
          (success) => {
            $scope.translationHtml = updatedTranslation;
            $scope.translationUpdated = true;
            ContributionOpportunitiesService.
              reloadOpportunitiesEventEmitter.emit();
          },
          $scope.showTranslationSuggestionUpdateError);
        $scope.startedEditing = false;
      };

      delete suggestionIdToSuggestion[initialSuggestionId];
      var remainingSuggestions = Object.entries(suggestionIdToSuggestion);

      if (reviewable) {
        SiteAnalyticsService
          .registerContributorDashboardViewSuggestionForReview('Translation');
      }

      // The length of the commit message should not exceed 375 characters,
      // since this is the maximum allowed commit message size.
      var generateCommitMessage = function() {
        var contentId = $scope.activeSuggestion.change.content_id;
        var stateName = $scope.activeSuggestion.change.state_name;
        var contentType = contentId.split('_')[0];

        var commitMessage =  `${contentType} section of "${stateName}" card`;
        if ($scope.translationUpdated) {
          commitMessage = commitMessage + '(With Edits)';
        }

        return commitMessage;
      };

      var _getThreadHandlerUrl = function(suggestionId) {
        return UrlInterpolationService.interpolateUrl(
          '/threadhandler/<suggestionId>', { suggestionId });
      };

      var _getThreadMessagesAsync = function(threadId) {
        return $http.get(_getThreadHandlerUrl(threadId)).then((response) => {
          let threadMessageBackendDicts = response.data.messages;
          return threadMessageBackendDicts.map(
            m => ThreadMessage.createFromBackendDict(m));
        });
      };

      var init = function() {
        $scope.resolvingSuggestion = false;
        $scope.lastSuggestionToReview = remainingSuggestions.length <= 0;
        $scope.translationHtml = (
          $scope.activeSuggestion.change.translation_html);
        $scope.status = $scope.activeSuggestion.status;
        $scope.contentHtml = (
          $scope.activeSuggestion.change.content_html);
        $scope.editedContent.html = $scope.translationHtml;
        $scope.reviewMessage = '';
        if (!reviewable) {
          $scope.suggestionIsRejected = (
            $scope.activeSuggestion.status === 'rejected');
          if ($scope.suggestionIsRejected) {
            _getThreadMessagesAsync($scope.activeSuggestionId).then(
              function(messageSummaries) {
                $scope.reviewMessage = messageSummaries[1].text;
              }
            );
          }
        }
      };

      init();

      $scope.showNextItemToReview = function(suggestionId) {
        resolvedSuggestionIds.push($scope.activeSuggestionId);
        var suggestionId = null;
        if ($scope.lastSuggestionToReview) {
          $uibModalInstance.close(resolvedSuggestionIds);
          return;
        }

        [$scope.activeSuggestionId, $scope.activeSuggestion] = (
          remainingSuggestions.pop());
        init();
      };

      $scope.acceptAndReviewNext = function() {
        $scope.finalCommitMessage = generateCommitMessage();
        if ($scope.translationUpdated) {
          $scope.reviewMessage = $scope.reviewMessage + ': This suggestion'+
            ' was submitted with reviewer edits.';
        }
        $scope.resolvingSuggestion = true;
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion(
          'Translation');

        ContributionAndReviewService.resolveSuggestionToExploration(
          $scope.activeSuggestion.target_id, $scope.activeSuggestionId,
          ACTION_ACCEPT_SUGGESTION,
          $scope.reviewMessage, $scope.finalCommitMessage,
          $scope.showNextItemToReview, (error) => {
            $scope.rejectAndReviewNext('Invalid Suggestion');
            AlertsService.clearWarnings();
            AlertsService.addWarning(`Invalid Suggestion: ${error.data.error}`);
          });
      };

      $scope.rejectAndReviewNext = function(reviewMessage) {
        $scope.resolvingSuggestion = true;
        SiteAnalyticsService.registerContributorDashboardRejectSuggestion(
          'Translation');

        ContributionAndReviewService.resolveSuggestionToExploration(
          $scope.activeSuggestion.target_id, $scope.activeSuggestionId,
          ACTION_REJECT_SUGGESTION, reviewMessage || $scope.reviewMessage,
          generateCommitMessage(), $scope.showNextItemToReview);
      };

      $scope.editSuggestion = function() {
        $scope.startedEditing = true;
      };

      $scope.cancelEdit = function() {
        $scope.startedEditing = false;
        $scope.editedContent.html = $scope.translationHtml;
      };

      $scope.cancel = function() {
        $uibModalInstance.close(resolvedSuggestionIds);
      };

      $scope.showTranslationSuggestionUpdateError = function(error) {
        AlertsService.clearWarnings();
        AlertsService.addWarning(`Invalid Suggestion: ${error.data.error}`);
      };
    }
  ]);
