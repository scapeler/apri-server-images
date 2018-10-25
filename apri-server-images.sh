#!/bin/sh

cd `dirname $0`
node apri-server-images.js >>$1 2>>$1
exit -1
