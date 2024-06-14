package org.example;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.*;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpVersion;
import io.netty.handler.codec.http.websocketx.*;
import io.netty.util.CharsetUtil;

import java.util.Date;
import java.util.LinkedList;
import java.util.List;

import static io.netty.handler.codec.http.HttpUtil.isKeepAlive;

/**
 * @author inkbox
 * @since 2022/12/15
 */
public class NioWebSocketHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private WebSocketServerHandshaker handshaker;
    private static List<Channel> channels = new LinkedList<>();

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame msg) throws Exception {
        //处理websocket客户端的消息
        handlerWebSocketFrame(ctx, msg);
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("添加连接");
        //添加连接
        channels.add(ctx.channel());

    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        //断开连接
        channels.remove(ctx.channel());
        System.out.println("关闭连接");
        for (int i = 0; i < channels.size(); i++) {
            channels.get(i).writeAndFlush(new TextWebSocketFrame("{\"type\":\"up\",\"count\":" + channels.size() + "}"));
        }
    }

    @Override
    public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
        ctx.flush();
    }
    private void handlerWebSocketFrame(ChannelHandlerContext ctx, WebSocketFrame frame){
        System.out.println(frame);
        // 判断是否关闭链路的指令
        if (frame instanceof CloseWebSocketFrame) {
            handshaker.close(ctx.channel(), (CloseWebSocketFrame) frame.retain());
            return;
        }
        // 判断是否ping消息
        if (frame instanceof PingWebSocketFrame) {
            ctx.channel().write(
                    new PongWebSocketFrame(frame.content().retain()));
            return;
        }
        // 本例程仅支持文本消息，不支持二进制消息
        if (!(frame instanceof TextWebSocketFrame)) {
            throw new UnsupportedOperationException(String.format(
                    "%s frame types not supported", frame.getClass().getName()));
        }
        // 返回应答消息
        String request = ((TextWebSocketFrame) frame).text();
        System.out.println("服务端收到：" + request);
        // 群发

        for (int i = 0; i < channels.size(); i++) {
            channels.get(i).write(new TextWebSocketFrame(request));
        }

    }

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof WebSocketServerProtocolHandler.HandshakeComplete){
            for (int i = 0; i < channels.size(); i++) {
                System.out.println("入场通知 "+i);
                channels.get(i).writeAndFlush(new TextWebSocketFrame("{\"type\":\"up\",\"count\":" + channels.size() + "}"));
            }
        }
    }


    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
    }
}
