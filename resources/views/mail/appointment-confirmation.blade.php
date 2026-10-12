<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <title>Код подтверждения записи</title>
</head>
<body style="margin:0;padding:24px;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e2df;border-radius:12px;">
        <tr>
            <td style="padding:24px;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#a8862f;">
                    {{ config('app.name') }}
                </p>

                <h1 style="margin:0 0 16px;font-size:20px;">Новая заявка на запись</h1>

                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
                    Код подтверждения:
                </p>

                <p style="margin:0 0 20px;font-size:30px;font-weight:bold;letter-spacing:0.28em;color:#a8862f;">
                    {{ $appointment->confirmation_code }}
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.7;border-top:1px solid #e2e2df;padding-top:12px;">
                    <tr>
                        <td style="padding:4px 0;color:#6b6b66;width:150px;">Номер заявки</td>
                        <td style="padding:4px 0;">#{{ $appointment->id }}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#6b6b66;">Клиент</td>
                        <td style="padding:4px 0;">{{ $appointment->client?->name ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#6b6b66;">Телефон</td>
                        <td style="padding:4px 0;">{{ $appointment->client?->phone ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#6b6b66;">Мастер</td>
                        <td style="padding:4px 0;">{{ $appointment->master?->user?->name ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#6b6b66;">Услуга</td>
                        <td style="padding:4px 0;">{{ $appointment->service?->name ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:4px 0;color:#6b6b66;">Дата и время</td>
                        <td style="padding:4px 0;">
                            {{ $appointment->starts_at?->translatedFormat('j F Y, H:i') }}
                        </td>
                    </tr>
                    @if ($appointment->client_comment)
                        <tr>
                            <td style="padding:4px 0;color:#6b6b66;">Комментарий клиента</td>
                            <td style="padding:4px 0;">{{ $appointment->client_comment }}</td>
                        </tr>
                    @endif
                </table>

                <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#6b6b66;">
                    Заявка ждёт подтверждения. Мастер подтверждает её в панели и называет
                    стоимость; код нужен, чтобы связать звонок клиента с этой заявкой.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
