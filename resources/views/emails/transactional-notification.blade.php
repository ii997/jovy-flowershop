<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;background:#FAF9F6;color:#0A2A1B;font-family:Arial,sans-serif;line-height:1.6;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;">
        <p style="color:#D97706;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">Jovy's Flowershop</p>
        <h1 style="font-size:24px;margin:0 0 16px;">{{ $title }}</h1>
        <p style="white-space:pre-line;">{{ $body }}</p>
        <p style="font-size:13px;color:#64748b;">Order reference: {{ $orderReference }}</p>
        @if ($supportPhone)
            <p style="font-size:13px;color:#64748b;">Need help? Contact us at {{ $supportPhone }}.</p>
        @endif
    </div>
</body>
</html>
