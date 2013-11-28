#!/bin/bash

sort /usr/share/dict/american-english /usr/share/dict/british-english | uniq | grep "^[a-z]\{3,\}$" > words
