.PHONY: test build demo pack clean

test:
	npm test

build:
	node bin/fathom.js build

demo:
	cd demo && node ../bin/fathom.js build && node ../bin/fathom.js serve --port 8080

pack:
	npm pack --dry-run

clean:
	node -e "require('node:fs').rmSync('fathom-dist',{recursive:true,force:true})"
