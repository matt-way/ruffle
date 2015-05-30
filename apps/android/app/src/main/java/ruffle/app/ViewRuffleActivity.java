package ruffle.app;

import android.annotation.TargetApi;
import android.app.Activity;
import android.app.ActivityOptions;
import android.content.Intent;
import android.media.Image;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.widget.ImageView;


/**
 * An example full-screen activity that shows and hides the system UI (i.e.
 * status bar and navigation/system bar) with user interaction.
 *
 * @see SystemUiHider
 */
public class ViewRuffleActivity extends Activity {

    ImageView ruffleImg;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_view_ruffle);

        ruffleImg = (ImageView)findViewById(R.id.imageView);

        ruffleImg.setOnTouchListener(new View.OnTouchListener() {

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                //Log.v("mffa", "uubgfbfbgbfuup");
                if (event.getAction() == MotionEvent.ACTION_UP) {
                    finish();
                    return true;
                }

                return false;
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();

        overridePendingTransition(0, 0);
    }
}
