/*
錄音
https://github.com/xiangyuecn/Recorder
src: extensions/lib.fft.js
*/
!function(){var r="object"==typeof window&&!!window.document,o=(r?window:Object).Recorder,t=o.i18n;!function(r){"use strict";r.LibFFT=function(r){var o,t,n,a,f,i,e,u,c=function(r){var c,h,M,d;for(o=Math.round(Math.log(r)/Math.log(2)),n=((t=1<<o)<<2)*Math.sqrt(2),a=[],f=[],i=[0],e=[0],u=[],c=0;c<t;c++){for(M=c,h=0,d=0;h!=o;h++)d<<=1,d|=1&M,M>>>=1;u[c]=d}var w,s=2*Math.PI/t;for(c=(t>>1)-1;c>0;c--)w=c*s,e[c]=Math.cos(w),i[c]=Math.sin(w)},h=function(r){var c,h,M,d,w,s,v,b,l=1,F=o-1;for(c=0;c!=t;c++)a[c]=r[u[c]],f[c]=0;for(c=o;0!=c;c--){for(h=0;h!=l;h++)for(w=e[h<<F],s=i[h<<F],M=h;M<t;M+=l<<1)v=w*a[d=M+l]-s*f[d],b=w*f[d]+s*a[d],a[d]=a[M]-v,f[d]=f[M]-b,a[M]+=v,f[M]+=b;l<<=1,F--}h=t>>1;var g=new Float64Array(h);for(s=n,w=-n,c=h;0!=c;c--)v=a[c],b=f[c],g[c-1]=v>w&&v<s&&b>w&&b<s?0:Math.round(v*v+b*b);return g};return c(r),{transform:h,bufferSize:t}}}(o,0,t.$T)}();