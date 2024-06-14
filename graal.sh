init=$(echo '{"bundles":[],"resources":{"includes":[{"pattern": "\\QMETA-INF/services/java.lang.System$LoggerFinder\\E"},{"pattern": "\\QMETA-INF/services/java.nio.channels.spi.SelectorProvider\\E"}]}}')
dir="/project/src/main/resources"
# https://blog.csdn.net/catoop/article/details/138269014
cd $dir
set -ex
for line in $(find ./static -type f)
do
    echo "current = $line"
    line=${line:2}
    init=$(echo $init | jq --arg key "\\Q$line\\E" '.resources.includes += [{"pattern":  $key  }]' )
done
mkdir -p $dir/META-INF/native-image/org.example/s/
echo $init > $dir/META-INF/native-image/org.example/s/resource-config.json
ls $dir/META-INF/native-image/org.example/s/resource-config.json
cat $dir/META-INF/native-image/org.example/s/resource-config.json

