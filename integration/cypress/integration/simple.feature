Feature: Basic test

  Background:
    Given a compatible bridge
    And I'm at the test bench

  Scenario: It doesn't crash
    When nothing is done for 1 seconds
    Then client is bootstrapped
    * 1 tabOpened event is emitted
    * 1 pageOpened event is emitted
    * 1 pageLoaded event is emitted
