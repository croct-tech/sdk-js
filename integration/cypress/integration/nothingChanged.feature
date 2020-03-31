Feature: Nothing changed every 30 seconds

  Background:
    Given a compatible bridge
    And I'm at the test bench

  Scenario: Idling for a minute
    When nothing is done for 1 seconds
    Then client is bootstrapped

    When nothing is done for 30 seconds
    Then 1 nothingChanged event is emitted

    When nothing is done for 30 seconds
    Then 1 nothingChanged event is emitted
