<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class VerifyRegistrationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify your email',
            replyTo: [config('mail.from.address')],
        );
    }

    public function content(): Content
    {
        $verificationUrl = URL::temporarySignedRoute(
            'register.verify',
            now()->addDays(1),
            ['user' => $this->user->id]
        );

        return new Content(
            view: 'emails.verify-registration',
            with: ['verificationUrl' => $verificationUrl, 'user' => $this->user]
        );
    }
}
