build:
	docker build . -t 'windix/bom-converter'

deploy: build
	docker stop bom-converter && \
	docker run --name bom-converter --rm -p 18080:8080 -d windix/bom-converter
