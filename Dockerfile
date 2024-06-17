# syntax=docker/dockerfile:1
FROM node:18.17.0 as vue
COPY vue /vue
RUN cd vue && npm i && npm run build

#FROM eclipse-temurin:21-jdk-alpine as vm
#ARG MAVEN_HOME=/usr/local/lib/maven
#ARG MAVEN_VERSION=3.9.2
#ENV PATH ${PATH}:${MAVEN_HOME}/apache-maven-${MAVEN_VERSION}/bin
#RUN jlink --add-modules java.base --add-modules java.logging --add-modules jdk.crypto.ec --strip-debug --no-man-pages --no-header-files --compress=2 --output /vm
#RUN wget -q https://repo.huaweicloud.com/apache/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz && mkdir -p ${MAVEN_HOME} && tar -zxvf apache-maven-${MAVEN_VERSION}-bin.tar.gz -C ${MAVEN_HOME} && rm -rf apache-maven-${MAVEN_VERSION}-bin.tar.gz
#COPY . /project
#COPY --from=vue /vue/dist /project/src/main/resources/static
#RUN --mount=type=cache,mode=0777,target=/root/.m2 cd /project && mvn package -Dskip.native=true

FROM ghcr.io/graalvm/native-image-community:21-muslib as graal
ARG MAVEN_HOME=/usr/local/lib/maven
ARG MAVEN_VERSION=3.9.2
ENV PATH ${PATH}:${MAVEN_HOME}/apache-maven-${MAVEN_VERSION}/bin
RUN microdnf install -y wget && microdnf install -y jq && microdnf install -y findutils && wget -q https://repo.huaweicloud.com/apache/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz && mkdir -p ${MAVEN_HOME} && tar -zxvf apache-maven-${MAVEN_VERSION}-bin.tar.gz -C ${MAVEN_HOME} && rm -rf apache-maven-${MAVEN_VERSION}-bin.tar.gz
COPY . /project
COPY --from=vue /vue/dist /project/src/main/resources/static

WORKDIR /project
# 前置资源处理
RUN sh graal.sh
#RUN <<EOT sh
#    set -ex
#    for line in $(find $dir -type f)
#    do
#        echo "current = $line"
#        init=$(echo $init | jq --arg key "\\Q$line\\E" '.resources.includes += [{"pattern":  $key  }]' )
#    done
#    mkdir -p $dir/META-INF/native-image/org.example/s/
#    echo $init > $dir/META-INF/native-image/org.example/s/resource-config.json
#    ls $dir/META-INF/native-image/org.example/s/resource-config.json
#    cat $dir/META-INF/native-image/org.example/s/resource-config.json
#EOT

#RUN  #\
#for line in $(find $dir -type f)\
#do \
#    echo $line \
#        init=$(echo $init | jq --arg key "\\Q$line\\E" '.resources.includes += [{"pattern":  $key  }]' ) \
#done \
#    mkdir -p $dir/META-INF/native-image/org.example/s/ \
#echo $init > $dir/META-INF/native-image/org.example/s/resource-config.json \
#    ls $dir/META-INF/native-image/org.example/s/resource-config.json \
#    cat $dir/META-INF/native-image/org.example/s/resource-config.json



RUN --mount=type=cache,mode=0777,target=/root/.m2 cd /project && mvn package -X -Dskip.native=false -Dskip.copy=false && chmod +x target/s-native && ls -l -h target

FROM alpine
#COPY --from=vm /vm /vm
#COPY --from=vm /project/target/s-1.0-SNAPSHOT-jar-with-dependencies.jar s-1.0-SNAPSHOT-jar-with-dependencies.jar
#COPY --from=graal /project/target/s-1.0-SNAPSHOT-jar-with-dependencies.jar s-1.0-SNAPSHOT-jar-with-dependencies.jar
COPY --from=graal /project/target/s-native /native

EXPOSE 38293
#ENTRYPOINT ["/vm/bin/java","-jar","/s-1.0-SNAPSHOT-jar-with-dependencies.jar"]

ENTRYPOINT ["/native"]
