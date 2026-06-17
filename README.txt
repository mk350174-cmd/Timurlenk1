stitch_continuous_progress_tracker.zip — 10 MB Parçalara Bölünmüş
=====================================================================

Orijinal dosya: stitch_continuous_progress_tracker.zip
Orijinal boyut: 75.44 MB (79,103,153 byte)
Parça sayısı: 8 (her biri 10 MB, sonuncusu 5.5 MB)
Bölme yöntemi: GNU `split -b 10M` (ham byte bölme — zip yapısı korunur)

PARÇALARI BİRLEŞTİRME
---------------------

Linux / macOS (terminal):
    cat stitch_continuous_progress_tracker.zip.*.part > stitch_continuous_progress_tracker.zip

Windows (PowerShell):
    cmd /c "copy /b stitch_continuous_progress_tracker.zip.00.part + stitch_continuous_progress_tracker.zip.01.part + stitch_continuous_progress_tracker.zip.02.part + stitch_continuous_progress_tracker.zip.03.part + stitch_continuous_progress_tracker.zip.04.part + stitch_continuous_progress_tracker.zip.05.part + stitch_continuous_progress_tracker.zip.06.part + stitch_continuous_progress_tracker.zip.07.part stitch_continuous_progress_tracker.zip"

Windows (CMD):
    copy /b stitch_continuous_progress_tracker.zip.00.part + stitch_continuous_progress_tracker.zip.01.part + stitch_continuous_progress_tracker.zip.02.part + stitch_continuous_progress_tracker.zip.03.part + stitch_continuous_progress_tracker.zip.04.part + stitch_continuous_progress_tracker.zip.05.part + stitch_continuous_progress_tracker.zip.06.part + stitch_continuous_progress_tracker.zip.07.part stitch_continuous_progress_tracker.zip

DOĞRULAMA (SHA-256)
-------------------
Birleştirme sonrası dosyanın bütünlüğünü doğrulamak için checksums.txt
dosyasındaki SHA-256 değeriyle karşılaştırın:

Linux/macOS:  sha256sum -c checksums.txt
Windows:      certutil -hashfile stitch_continuous_progress_tracker.zip SHA256
