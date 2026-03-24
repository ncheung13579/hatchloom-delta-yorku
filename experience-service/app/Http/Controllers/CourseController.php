<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\CourseDataProviderInterface;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    public function __construct(
        private readonly CourseDataProviderInterface $courseProvider,
    ) {}

    /**
     * GET /api/school/courses — List all available courses.
     *
     * Used by the frontend's Create Experience modal to populate the course picker.
     * Returns all courses from the data provider (mock or real).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->courseProvider->getAllCourses(),
        ]);
    }
}
