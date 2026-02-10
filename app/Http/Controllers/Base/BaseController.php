<?php

namespace App\Http\Controllers\Base;

use Illuminate\Routing\Controller as BaseLaravelController;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;

class BaseController extends BaseLaravelController
{
    use AuthorizesRequests, ValidatesRequests;
    
    // Common Logic across API
    
    protected function success($data = [], $message = 'Success', $code = 200)
    {
        return response()->json([
            'status' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }
    
    protected function error($message = 'Error', $code = 400, $errors = [])
    {
        return response()->json([
            'status' => false,
            'message' => $message,
            'errors' => $errors
        ], $code);
    }
}
