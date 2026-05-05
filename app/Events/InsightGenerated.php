<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InsightGenerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $message;
    public array $content;
    public int|string $userId;

    /**
     * Create a new event instance.
     */
    public function __construct(int|string $userId, string $message, array $content)
    {
        $this->userId = $userId;
        $this->message = $message;
        $this->content = $content;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('insights.' . $this->userId),
        ];
    }
}