<?php

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

    default:
        echo \json_encode(['error' => 'Invalid expression']);
        break;
}

