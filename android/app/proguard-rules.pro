-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}
