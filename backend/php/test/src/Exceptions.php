<?php

declare(strict_types=1);

namespace BackendPhpTest;

class ValidationException extends \RuntimeException {}

class DuplicateKeyException extends \RuntimeException
{
    public function __construct(public readonly string $key)
    {
        parent::__construct('duplicate idempotency key: ' . $key);
    }
}

class NotFoundException extends \RuntimeException {}
