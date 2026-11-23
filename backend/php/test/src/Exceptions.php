<?php
declare(strict_types=1);

namespace App;

use RuntimeException;

abstract class DomainException extends RuntimeException
{
    /** @param array<string, mixed> $context */
    public function __construct(
        public readonly int $errorCode,
        string $message,
        public readonly array $context = [],
    ) {
        parent::__construct($message, $errorCode);
    }
}

final class InvalidInputException extends DomainException
{
    /** @param array<string, mixed> $context */
    public function __construct(string $message, array $context = [])
    {
        parent::__construct(40001, $message, $context);
    }
}

final class ConflictException extends DomainException
{
    /** @param array<string, mixed> $context */
    public function __construct(string $message, array $context = [])
    {
        parent::__construct(40901, $message, $context);
    }
}

final class NestedTransactionException extends DomainException
{
    public function __construct(string $message = 'Nested transaction is not supported')
    {
        parent::__construct(50002, $message);
    }
}
