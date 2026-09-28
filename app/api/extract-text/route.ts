import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;

    if (!resumeFile) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }

    if (!(resumeFile instanceof File)) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }

    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from the PDF. Please ensure your resume is not image-based.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ resumeText });
  } catch (error: any) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from resume', details: error.message },
      { status: 500 }
    );
  }
}
