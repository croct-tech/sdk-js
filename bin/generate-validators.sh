#!/bin/sh

def="import {ValidateFunction} from 'ajv';\n\ndeclare var validate: ValidateFunction;\n\nexport default validate;\n"

for path in ./schema/*.json; do
    basename="${path##*/}"
    filename="${basename%.json}"

    ajv compile --json-pointers --inline-refs=false -s ./schema/${filename}.json -r "./schema/*.json" -o ./validation/${filename}.js
    echo ${def} > ./validation/${filename}.d.ts
done