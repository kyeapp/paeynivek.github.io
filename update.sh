#!/bin/bash

coin_types=("space" "web" "rings" "master" "hdri-je-gray-02" "hdri-small-studio-3" "hdri-the-sky-is-on-fire" "hdri-drakensberg-solitary-mountain")

echo $coin_types

rm -rf three.js assets
cp -r ../threejs-coin/three.js .
cp -r ../threejs-coin/assets .

for ct in ${coin_types[@]};
do
	rm -rf $ct
	cd ../threejs-coin
	git checkout $ct

	cd ../paeynivek.github.io
	mkdir $ct
	cp ../threejs-coin/src/index.html ./$ct/.
	cp ../threejs-coin/src/coin.js ./$ct/.
done


