#!/bin/sh
npm list -g git-format-staged@2.1.3 || npm install -g git-format-staged@2.1.3
npm list -g husky@7.0.4 || npm install -g husky@7.0.4
npm list -g prettier@2.5.1 || npm install -g prettier@2.5.1

husky install