FROM archlinux:latest
RUN pacman --noconfirm -Syyu git nodejs npm yarn unzip

WORKDIR /root
COPY ./* ./
CMD yarn run all
