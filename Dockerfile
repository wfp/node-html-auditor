FROM phusion/baseimage:latest

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

RUN apt-get -yqq update
RUN apt-get -yqq upgrade
RUN apt-get install -yqq curl

RUN curl -sL https://deb.nodesource.com/setup_0.12 | sudo -E bash -
RUN apt-get install -yqq nodejs

RUN apt-get install -yqq libgtk2.0-0 libgdk-pixbuf2.0-0 libfontconfig1 libxrender1 libx11-6 libglib2.0-0 libxft2 libfreetype6 libc6 zlib1g libpng12-0 libstdc++6-4.8-dbg-arm64-cross libgcc1 
RUN npm install -g phantomjs

ONBUILD ADD ./ /opt/application
ONBUILD WORKDIR /opt/application
ONBUILD RUN npm install
ONBUILD RUN npm link

# Clean up
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
