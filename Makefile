build: components index.js
	@component build --dev

components: component.json
	@component install --dev

test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec

dist: components dist-build dist-minify

dist-build:
	@component build -s reverse-regex -o dist -n reverse-regex

dist-minify: dist/reverse-regex.js
	@curl -s \
		-d compilation_level=SIMPLE_OPTIMIZATIONS \
		-d output_format=text \
		-d output_info=compiled_code \
		--data-urlencode "js_code@$<" \
		http://closure-compiler.appspot.com/compile \
		> $<.tmp
	@mv $<.tmp dist/reverse-regex.min.js

.PHONY: test
