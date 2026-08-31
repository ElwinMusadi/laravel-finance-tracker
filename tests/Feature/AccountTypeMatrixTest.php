<?php

use App\Services\AccountTypeMatrix;

beforeEach(function () {
    $this->matrix = new AccountTypeMatrix;
});

describe('valid combinations', function () {
    it('allows opening balance: equity → asset', function () {
        expect($this->matrix->isValidCombination('equity', 'asset'))->toBeTrue();
    });

    it('allows income: revenue → asset', function () {
        expect($this->matrix->isValidCombination('revenue', 'asset'))->toBeTrue();
    });

    it('allows expense: asset → expense', function () {
        expect($this->matrix->isValidCombination('asset', 'expense'))->toBeTrue();
    });

    it('allows transfer: asset → asset', function () {
        expect($this->matrix->isValidCombination('asset', 'asset'))->toBeTrue();
    });

    it('allows borrowing: liability → asset', function () {
        expect($this->matrix->isValidCombination('liability', 'asset'))->toBeTrue();
    });

    it('allows debt repayment: asset → liability', function () {
        expect($this->matrix->isValidCombination('asset', 'liability'))->toBeTrue();
    });
});

describe('invalid combinations', function () {
    it('blocks revenue → expense', function () {
        expect($this->matrix->isValidCombination('revenue', 'expense'))->toBeFalse();
    });

    it('blocks expense → asset', function () {
        expect($this->matrix->isValidCombination('expense', 'asset'))->toBeFalse();
    });

    it('blocks liability → expense', function () {
        expect($this->matrix->isValidCombination('liability', 'expense'))->toBeFalse();
    });

    it('blocks equity → expense', function () {
        expect($this->matrix->isValidCombination('equity', 'expense'))->toBeFalse();
    });

    it('blocks revenue → liability', function () {
        expect($this->matrix->isValidCombination('revenue', 'liability'))->toBeFalse();
    });

    it('blocks expense → expense', function () {
        expect($this->matrix->isValidCombination('expense', 'expense'))->toBeFalse();
    });

    it('blocks liability → liability', function () {
        expect($this->matrix->isValidCombination('liability', 'liability'))->toBeFalse();
    });

    it('blocks equity → liability', function () {
        expect($this->matrix->isValidCombination('equity', 'liability'))->toBeFalse();
    });

    it('blocks expense → revenue', function () {
        expect($this->matrix->isValidCombination('expense', 'revenue'))->toBeFalse();
    });

    it('blocks unknown source type', function () {
        expect($this->matrix->isValidCombination('unknown', 'asset'))->toBeFalse();
    });
});
