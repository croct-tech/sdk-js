Feature: Basic test

  @focus
  Scenario: It doesn't crash
    When nothing is done for 1 seconds
    Then 1 tabOpened event is emitted
    * 1 pageOpened event is emitted
    * 1 pageLoaded event is emitted
