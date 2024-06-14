package org.example;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.PooledByteBufAllocator;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.*;
import io.netty.util.AsciiString;
import io.netty.util.CharsetUtil;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;

import static io.netty.handler.codec.http.HttpUtil.isKeepAlive;

public class StaticResourceHandler extends SimpleChannelInboundHandler<FullHttpRequest> {
    /**
     * 从目录中获取
     */
    private final boolean fromDir;

    public StaticResourceHandler(boolean fromDir) {
        super();
        this.fromDir = fromDir;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest request) throws Exception {

        String uri = request.uri();
        int index = -1;
        if ((index = uri.indexOf("?")) != -1) {
            uri = uri.substring(0, index);
        }
        if (uri.equals("/sudoku/new")) {
            sudokuNewGame(ctx, request);
            return;
        }


        if (uri.equals("/") || uri.isEmpty()) {
            uri = "/index.html";
        }

        try (InputStream resourceAsStream = getClass().getResourceAsStream("/static" + uri)) {
            if (resourceAsStream == null) {
                System.out.println(uri + " not found");
                sendHttpResponse(ctx, request, new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.NOT_FOUND));
                return;
            }
            byte[] text = getText(resourceAsStream);
            String en = "; charset=utf-8";
            Map<String, AsciiString> css = Map.of(
                    "css", AsciiString.cached("text/css" + en),
                    "html", AsciiString.cached("text/html" + en),
                    "js", AsciiString.cached("text/javascript" + en),
                    "svg", AsciiString.cached("image/svg+xml" + en)
            );
            writeText(ctx, HttpResponseStatus.OK, text, css.get(uri.substring(uri.indexOf(".") + 1)));
        } catch (Exception e) {
            e.printStackTrace();
            sendHttpResponse(ctx, request, new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, HttpResponseStatus.NOT_FOUND));
        }


    }

    /**
     * get请求
     *
     * @param path
     * @param param
     * @return
     */
    public static String get(String path, Map<String, Object> param) {
        try {
            if (param != null) {
                StringBuffer paramBuffer = new StringBuffer();
                int i = 0;
                for (String key : param.keySet()) {
                    if (i == 0)
                        paramBuffer.append("?");
                    else
                        paramBuffer.append("&");
                    paramBuffer.append(key).append("=").append(param.get(key));
                    i++;
                }
                path += paramBuffer;
            }
            URL url = new URL(path);    // 把字符串转换为URL请求地址
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();// 打开连接
            connection.setRequestProperty("Referer", "https://sudoku.com/zh/killer/zhuanjia/");
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0");
            connection.setRequestProperty("Cookie", "first_visit=fv%3D1715847095%26dt%3D1715847095; mode=killer; ab_test=ab_aniview4_desktop%3Dab_aniview4_desktop_off%26dt%3D1716343583; sdk_adw=1; sdk_analytics=1; sdk_confirm=1; __cflb=02DiuE7hKpaqvCsoqtT41sbucqM5JAhhCHjeBDvWPy9LQ");
            connection.setRequestProperty("X-Requested-With", "XMLHttpRequest");
            connection.connect();// 连接会话
            // 获取输入流
            BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line;
            StringBuilder sb = new StringBuilder();
            while ((line = br.readLine()) != null) {// 循环读取流
                sb.append(line);
            }
            br.close();// 关闭流
            connection.disconnect();// 断开连接
            return sb.toString();
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("失败!");
            return null;
        }
    }

    /**
     * 数独newGame
     *
     * @param ctx
     * @param request
     */
    private void sudokuNewGame(ChannelHandlerContext ctx, FullHttpRequest request) {
//        https://sudoku.com/api/level/expert?mode=killer

        String s = get("https://sudoku.com/api/level/expert?mode=killer", Collections.emptyMap());
        if (s != null)
            writeText(ctx, HttpResponseStatus.OK, s.getBytes(StandardCharsets.UTF_8), AsciiString.cached("application/json"));
        else {
            writeText(ctx, HttpResponseStatus.INTERNAL_SERVER_ERROR, "error".getBytes(StandardCharsets.UTF_8), AsciiString.cached("application/json"));
        }
    }

    private byte[] getText(InputStream in) throws IOException {

        BufferedInputStream inp = new BufferedInputStream(in);
        return inp.readAllBytes();
    }

    private void writeText(ChannelHandlerContext ctx, HttpResponseStatus status, byte[] buf, AsciiString contentType) {
        ByteBuf byteBuf = PooledByteBufAllocator.DEFAULT.directBuffer(buf.length).writeBytes(buf);
        FullHttpResponse response = new DefaultFullHttpResponse(HttpVersion.HTTP_1_1, status, byteBuf);
        HttpHeaders httpHeaders = response.headers()
                .setInt(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
        if (contentType != null) {
            httpHeaders.set(HttpHeaderNames.CONTENT_TYPE, contentType + "; charset=utf-8");
        }
        ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
    }


    /**
     * 拒绝不合法的请求，并返回错误信息
     */
    private void sendHttpResponse(ChannelHandlerContext ctx,
                                  FullHttpRequest req, DefaultFullHttpResponse res) {
        // 返回应答给客户端
        if (res.status().code() != 200) {
            ByteBuf buf = Unpooled.copiedBuffer(res.status().toString(),
                    CharsetUtil.UTF_8);
            res.headers().set(HttpHeaderNames.CONTENT_LENGTH, buf.readableBytes());
            res.content().writeBytes(buf);
            buf.release();
        }
        ChannelFuture f = ctx.channel().writeAndFlush(res);
        // 如果是非Keep-Alive，关闭连接
        if (!isKeepAlive(req) || res.status().code() != 200) {
            f.addListener(ChannelFutureListener.CLOSE);
        }
    }
}
