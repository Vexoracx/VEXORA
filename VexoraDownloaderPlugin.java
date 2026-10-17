package com.vexora.app;

import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Unduh file ke Download/VEXORA lewat DownloadManager sistem (progres + notifikasi bawaan Android). */
@CapacitorPlugin(name = "VexoraDownloader")
public class VexoraDownloaderPlugin extends Plugin {

    private DownloadManager dm() {
        return (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
    }

    @PluginMethod
    public void enqueue(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url kosong");
            return;
        }
        String name = call.getString("fileName", "vexora-media");
        name = name.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_");
        try {
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            r.setTitle(name);
            r.setDescription("VEXORA");
            r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "VEXORA/" + name);
            String mime = call.getString("mime");
            if (mime != null && !mime.isEmpty()) r.setMimeType(mime);
            r.addRequestHeader("User-Agent",
                "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36");
            long id = dm().enqueue(r);
            JSObject o = new JSObject();
            o.put("id", String.valueOf(id));
            call.resolve(o);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void status(PluginCall call) {
        String sid = call.getString("id");
        JSObject o = new JSObject();
        if (sid == null) {
            call.reject("id kosong");
            return;
        }
        Cursor c = null;
        try {
            c = dm().query(new DownloadManager.Query().setFilterById(Long.parseLong(sid)));
            if (c != null && c.moveToFirst()) {
                int st = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                long got = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                long total = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                String state = st == DownloadManager.STATUS_SUCCESSFUL ? "done"
                    : st == DownloadManager.STATUS_FAILED ? "failed" : "running";
                o.put("state", state);
                o.put("bytes", got);
                o.put("total", total);
            } else {
                o.put("state", "failed");
                o.put("bytes", 0);
                o.put("total", 0);
            }
            call.resolve(o);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        } finally {
            if (c != null) c.close();
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        try {
            String sid = call.getString("id");
            if (sid != null) dm().remove(Long.parseLong(sid));
        } catch (Exception ignored) { }
        call.resolve();
    }
}
