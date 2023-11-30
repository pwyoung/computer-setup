.PHONY=default FORCE build test

default: test

FORCE:

build: FORCE
	./run -b

test: build
	./run -t

clean: FORCE
	./run -c

clean-all: clean
	./run -C

plan: FORCE
	./run -p

