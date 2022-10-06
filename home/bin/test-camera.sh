#!/bin/bash

# ARDUCAM DOCS:
#   - https://www.arducam.com/docs/uvc-camera-module/how-to-access-arducam-uvc-cameras-using-opencv-python-and-gstreamer-introduction-on-linux/#42-streaming
#   - https://www.arducam.com/docs/uvc-camera-module/use-arducam-uvc-cameras-on-linux/uvc-cameras-on-linux-command-line/



look_for_camera(){
    lsusb  | grep -i cam
    #Bus 001 Device 037: ID 0c45:636d Microdia Arducam IMX477 HQ Camera

    v4l2-ctl --info

}

show_resolution_and_fps() {
    v4l2-ctl --list-formats-ext -d 0
}

install_deps() {
    PKGS=""
    
    #PKGS+=" vlc"
    
    PKGS+=" v4l-utils"
    
    #PKGS+=" ffmpeg"
    
    PKGS+=" gstreamer1.0-tools"
    #PKGS+=" gstreamer1.0-plugins-ugly" # Forx264enc
    
    sudo apt install -y $PKGS
}

tune_camera() {
    v4l2-ctl --list-ctrls | egrep 'brightness|gain'
    v4l2-ctl --set-ctrl brightness=16 #/32 #/64
    v4l2-ctl --set-ctrl gain=25 # /50 #/100
}

setup_for_streaming() {
    open https://www.xmodulo.com/live-stream-video-webcam-linux.html
}

how_to_use_v4l() {
    open https://github.com/kmdouglass/v4l2-examples
    open https://stackoverflow.com/questions/1738828/how-to-use-learn-video4linux2-on-screen-display-output-apis
}

show_vlc() {
    VLC_APP='cvlc' # hide controls
    #VLC_APP='vlc' # show standard UI

    DEV="v4l2:///dev/video0"

    OPTS=""
    # OPTS+=" --no-fullscreen"
    OPTS+=" --video-wallpaper" # use with cvlcx

    $VLC_APP  $OPTS $DEV
}

show_ffmpeg() {
    # -f fmt              force format
    ffmpeg -f v4l2 -list_formats all -i /dev/video0
    # Formats
    cat <<EOF >/dev/null
  libavutil      56. 51.100 / 56. 51.100
  libavcodec     58. 91.100 / 58. 91.100
  libavformat    58. 45.100 / 58. 45.100
  libavdevice    58. 10.100 / 58. 10.100
  libavfilter     7. 85.100 /  7. 85.100
  libavresample   4.  0.  0 /  4.  0.  0
  libswscale      5.  7.100 /  5.  7.100
  libswresample   3.  7.100 /  3.  7.100
  libpostproc    55.  7.100 / 55.  7.100
[video4linux2,v4l2 @ 0x5593a15fa0] Compressed:       mjpeg :          Motion-JPEG : 4032x3040 3840x2160 2592x1944 2560x1440 1920x1080 1600x1200 1280x960 1280x720 640x480
EOF

    #ffmpeg -f lavfi -i color=c=black:s=1920x1080:r=25/1 -vcodec rawvideo -pix_fmt yuv420p -f v4l2 /dev/video0
    #ffmpeg -f v4l2 /dev/video0


}

capture_screen_not_camera_output() {
    ffmpeg -f x11grab -r 25 -s 640x480 -i :0.0 /tmp/VideoOutput.mpg
}

show_gstreamer() {

    # WORK - but
    # PREVIEW
    # https://gstreamer.freedesktop.org/documentation/video4linux2/v4l2src.html?gi-language=c    
    gst-launch-1.0 v4l2src device=/dev/video0 ! image/jpeg,width=1280,height=720,framerate=30/1 ! jpegdec ! autovideosink
    #  gst-launch-1.0 v4l2src  device=/dev/video0 !  image/jpeg,width=1280,height=720,framerate=30/1 ! jpegdec ! xvimagesink

    
    # MJPEG
    #   https://www.arducam.com/docs/uvc-camera-module/how-to-access-arducam-uvc-cameras-using-opencv-python-and-gstreamer-introduction-on-linux/#42-streaming
    #   https://gstreamer.freedesktop.org/documentation/tutorials/basic/dynamic-pipelines.html?gi-language=c
    #gst-launch-1.0 v4l2src device=/dev/video0 ! image/jpeg,width=1280,height=720,framerate=30/1 ! decodebin ! autovideosink

    # MJPEG
    #gst-launch-1.0 v4l2src device=/dev/video0 ! image/jpeg,width=1280,height=720,framerate=100/1 ! decodebin ! autovideosink

    # Write to file
    #   https://stackoverflow.com/questions/21152303/how-to-use-gstreamer-to-save-webcam-video-to-file
    #   WARNING: erroneous pipeline: no element "ffmpegcolorspace"
    #gst-launch-1.0 v4l2src ! ffmpegcolorspace ! jpegenc ! avimux ! filesink location=output.avi
    #  No x264enc
    #gst-launch-1.0 v4l2src ! videoconvert ! x264enc ! flvmux ! filesink location=xyz.flv

    # BROKEN
    #
    # YUV
    # gst-launch-1.0 -vv v4l2src device=/dev/video0 ! video/x-raw,format=YUY2,width=1280,height=720,framerate=10/1 ! videoconvert ! autovideosink
    #
    #H.264
    #gst-launch-1.0 v4l2src device=/dev/video0 ! queue ! video/x-h264,width=1280,height=720,framerate=30/1 ! avdec_h264 ! autovideosink


    # Save Video
    #   https://gstreamer.freedesktop.org/documentation/video4linux2/v4l2src.html?gi-language=c
    #gst-launch-1.0 v4l2src device=/dev/video0 ! image/jpeg,width=1280,height=720,framerate=30/1 ! jpegdec ! x264enc ! qtmux ! filesink location=/tmp/test.mp4 -e


}

jetson_specific() {
    # R32 (release), REVISION: 6.1, GCID: 27863751, BOARD: t210ref, EABI: aarch64, DATE: Mon Jul 26 19:20:30 UTC 2021
    # Linux nano 4.9.253-tegra #1 SMP PREEMPT Mon Jul 26 12:13:06 PDT 2021 aarch64 aarch64 aarch64 GNU/Linux
    if [ -e /etc/nv_tegra_release ]; then
	cat /etc/nv_tegra_release
	uname -a
    fi
}


v4l2_use_wrapper_or_not() {
    v4l2-ctl --device /dev/video0 --info
    cat <<EOF >/dev/null
Driver Info (not using libv4l2):
	Driver name   : uvcvideo
	Card type     : Arducam IMX477 HQ Camera
	Bus info      : usb-70090000.xusb-2.4.4
	Driver version: 4.9.253
	Capabilities  : 0x84200001
		Video Capture
		Streaming
		Extended Pix Format
		Device Capabilities
	Device Caps   : 0x04200001
		Video Capture
		Streaming
		Extended Pix Format
EOF

    # USE V4L2 WRAPPER (do not go directly to device)
    v4l2-ctl -w --device /dev/video0 --info
    cat <<EOF >/dev/null
Opening in BLOCKING MODE 
Driver Info (using libv4l2):
	Driver name   : uvcvideo
	Card type     : Arducam IMX477 HQ Camera
	Bus info      : usb-70090000.xusb-2.4.4
	Driver version: 4.9.253
	Capabilities  : 0x85200001
		Video Capture
		Read/Write
		Streaming
		Extended Pix Format
		Device Capabilities
	Device Caps   : 0x05200001
		Video Capture
		Read/Write
		Streaming
		Extended Pix Format
EOF

    
    v4l2-ctl --list-ctrls --device /dev/video0
    cat <<EOF >/dev/null
                     brightness 0x00980900 (int)    : min=-64 max=64 step=1 default=0 value=0
                       contrast 0x00980901 (int)    : min=0 max=64 step=1 default=32 value=32
                     saturation 0x00980902 (int)    : min=0 max=128 step=1 default=64 value=64
                            hue 0x00980903 (int)    : min=-40 max=40 step=1 default=0 value=0
 white_balance_temperature_auto 0x0098090c (bool)   : default=1 value=1
                          gamma 0x00980910 (int)    : min=72 max=500 step=1 default=100 value=100
                           gain 0x00980913 (int)    : min=0 max=100 step=1 default=0 value=0
           power_line_frequency 0x00980918 (menu)   : min=0 max=2 default=2 value=2
      white_balance_temperature 0x0098091a (int)    : min=2800 max=6500 step=1 default=4600 value=4600 flags=inactive
                      sharpness 0x0098091b (int)    : min=0 max=6 step=1 default=3 value=3
         backlight_compensation 0x0098091c (int)    : min=0 max=2 step=1 default=1 value=1
                  exposure_auto 0x009a0901 (menu)   : min=0 max=3 default=3 value=3
              exposure_absolute 0x009a0902 (int)    : min=1 max=5000 step=1 default=157 value=157 flags=inactive
         exposure_auto_priority 0x009a0903 (bool)   : default=0 value=1
                     focus_auto 0x009a090c (bool)   : default=1 value=1
EOF

}

v4l2_get_one_frame() {
    if [ "this" == "fails" ]; then
	# http://trac.gateworks.com/wiki/linux/v4l2
	#capture a single raw frame using mmap method:
	v4l2-ctl --device /dev/video0 --stream-mmap --stream-to=frame.raw --stream-count=1
	# Convert to png
	convert -size 640x480 -depth 16 uyvy:frame.raw frame.png
	# Show
	xdg-open ./frame.png
    fi

    if [ "this_works" == "this_works" ]; then
	# This did work...
	#v4l2-ctl --device /dev/video0 --set-fmt-video=width=width,height=height,pixelformat=MJPG --stream-mmap --stream-to=./output.jpg --stream-count=1

	v4l2-ctl --device /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=MJPG --stream-mmap --stream-to=./output.jpg --stream-count=1
	xdg-open ./output.jpg

	echo "with wrapper"
	v4l2-ctl --device /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=MJPG --stream-mmap --stream-to=./output.2.jpg --stream-count=1
	xdg-open ./output.2.jpg	
    fi
   
}

v4l2_get_video() {
    # https://www.mankier.com/1/v4l2-ctl
    v4l2-ctl --device /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=MJPG --stream-mmap --stream-to=./output.mpg --stream-count=200
    xdg-open ./output.mpg

}

check_camera_linux_dev_info() {
    sudo udevadm info --query=all /dev/video0
}

install_deps

look_for_camera

#check_camera_linux_dev_info

tune_camera
show_resolution_and_fps
v4l2_use_wrapper_or_not    
v4l2_get_video
v4l2_get_one_frame

jetson_specific

show_gstreamer # Works on nano

# setup_for_streaming
# how_to_use_v4l

# capture_screen_not_camera_output

# Commented out
#show_vlc
#show_ffmpeg

#https://gstreamer.freedesktop.org/documentation/video4linux2/v4l2src.html?gi-language=c
