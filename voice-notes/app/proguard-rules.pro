# Vosk (JNI via JNA) needs its classes intact.
-keep class org.vosk.** { *; }
-keep class com.sun.jna.** { *; }
-dontwarn org.vosk.**
-dontwarn com.sun.jna.**

-dontwarn okhttp3.**
-dontwarn okio.**
