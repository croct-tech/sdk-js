<?php

usleep(100000);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Api-Key");

$expression = ($_GET['expression'] ?? null);

switch ($expression) {
    case "user's name":
        echo \json_encode(['result' => 'Marcos']);
        break;

    case "random":
        echo \json_encode(['result' => rand()]);
        break;

    case "user's perfectPlan":
        echo \json_encode(['result' => 'medium']);

    case "user's teamSize":
        echo \json_encode(['result' => 8]);
        break;

    default:
        echo \json_encode(['error' => 'Invalid expression']);
        break;
}

