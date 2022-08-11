FROM khaller/graphdb-free:9.10.0

ENV GDB_HEAP_SIZE=2G

RUN mkdir -p /repository.init/

RUN mkdir -p /temporary-folder/CLAV

COPY ./import/output.ttl /repository.init/CLAV/toLoad/animals-complete.ttl

COPY config.ttl /repository.init/CLAV/config.ttl