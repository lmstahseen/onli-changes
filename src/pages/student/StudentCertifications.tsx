import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../hooks/useAuth';
import { CertificationService, type Certification, type CertificationEnrollment } from '../../services/certificationService';
import ProgressBar from '../../components/analytics/ProgressBar';

const StudentCertifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'explore' | 'enrolled'>('enrolled');
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [enrolledCertifications, setEnrolledCertifications] = useState<{
    completed: (CertificationEnrollment & { certification: Certification })[];
    in_progress: (CertificationEnrollment & { certification: Certification })[];
  }>({
    completed: [],
    in_progress: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'technology', name: 'Technology' },
    { id: 'business', name: 'Business' },
    { id: 'data-science', name: 'Data Science' },
    { id: 'design', name: 'Design' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'personal-development', name: 'Personal Development' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all certifications and enrolled certifications in parallel
      const [allCertifications, enrolledData] = await Promise.all([
        CertificationService.getAllCertifications(),
        CertificationService.getEnrolledCertifications()
      ]);
      
      setCertifications(allCertifications);
      
      // Enhance enrolled certifications with full certification data
      const enhancedCompleted = await enhanceEnrollments(enrolledData.completed, allCertifications);
      const enhancedInProgress = await enhanceEnrollments(enrolledData.in_progress, allCertifications);
      
      setEnrolledCertifications({
        completed: enhancedCompleted,
        in_progress: enhancedInProgress
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const enhanceEnrollments = async (
    enrollments: CertificationEnrollment[],
    allCertifications: Certification[]
  ): Promise<(CertificationEnrollment & { certification: Certification })[]> => {
    return enrollments.map(enrollment => {
      const certification = allCertifications.find(c => c.id === enrollment.certification_id);
      return {
        ...enrollment,
        certification: certification!
      };
    });
  };

  const handleEnroll = async (certificationId: number) => {
    try {
      setIsEnrolling(true);
      setEnrollingId(certificationId);
      await CertificationService.enrollInCertification(certificationId);
      await loadData(); // Reload data after enrollment
      setActiveTab('enrolled'); // Switch to enrolled tab
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in certification');
    } finally {
      setIsEnrolling(false);
      setEnrollingId(null);
    }
  };

  const handleViewCertification = (certificationId: number) => {
    navigate(`/student/dashboard/certification/${certificationId}`);
  };

  const handleViewCertificate = (certificationId: number) => {
    navigate(`/student/dashboard/certificate/${certificationId}`);
  };

  const filteredCertifications = certifications.filter(certification => {
    const matchesSearch = certification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certification.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || certification.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalCertificates = enrolledCertifications.completed.length;
  const totalInProgress = enrolledCertifications.in_progress.length;
  const totalSkillsVerified = enrolledCertifications.completed.reduce(
    (sum, cert) => sum + (cert.certification.skills?.length || 0), 
    0
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading certifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Certifications</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certifications</h1>
        <p className="text-gray-600">Track your achievements and showcase your skills</p>
      </div>

      {/* Certification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <Icon name="medal-bold-duotone" size={32} className="text-yellow-500 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{totalCertificates}</p>
          <p className="text-gray-600">Earned Certificates</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="clock-circle-bold-duotone" size={32} className="text-blue-500 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{totalInProgress}</p>
          <p className="text-gray-600">In Progress</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="check-circle-bold-duotone" size={32} className="text-green-500 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{totalSkillsVerified}</p>
          <p className="text-gray-600">Skills Verified</p>
        </div>
        <div className="card p-6 text-center">
          <Icon name="share-bold-duotone" size={32} className="text-purple-500 mx-auto mb-3" />
          <p className="text-2xl font-bold text-gray-900">{Math.floor(totalCertificates * 0.7)}</p>
          <p className="text-gray-600">Shared on LinkedIn</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'enrolled'
                ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Certifications
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'explore'
                ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Explore Certifications
          </button>
        </div>
      </div>

      {/* Enrolled Certifications */}
      {activeTab === 'enrolled' && (
        <div>
          {/* Completed Certifications */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Certifications</h2>
            
            {enrolledCertifications.completed.length === 0 ? (
              <div className="card p-8 text-center">
                <Icon name="medal-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No certifications yet</h3>
                <p className="text-gray-600">Complete your first certification to earn a certificate!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {enrolledCertifications.completed.map((enrollment) => (
                  <div key={enrollment.id} className="card p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">{enrollment.certification.title}</h3>
                            <p className="text-gray-600 mb-2">Onliversity • {enrollment.certification.category}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Icon name="calendar-bold-duotone" size={16} />
                                Completed {new Date(enrollment.completed_at!).toLocaleDateString()}
                              </div>
                              <span>Grade: A</span>
                              <span>Category: {enrollment.certification.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Icon name="medal-bold-duotone" size={24} className="text-yellow-600" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Skills Verified:</h4>
                          <div className="flex flex-wrap gap-2">
                            {enrollment.certification.skills?.map((skill, index) => (
                              <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleViewCertificate(enrollment.certification_id)}
                            className="gradient-button text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                          >
                            <Icon name="download-bold-duotone" size={16} />
                            Download Certificate
                          </button>
                          <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
                            <Icon name="share-bold-duotone" size={16} />
                            Share on LinkedIn
                          </button>
                          <button 
                            onClick={() => handleViewCertification(enrollment.certification_id)}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In Progress Certifications */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">In Progress</h2>
            
            {enrolledCertifications.in_progress.length === 0 ? (
              <div className="card p-8 text-center">
                <Icon name="clock-circle-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses in progress</h3>
                <p className="text-gray-600 mb-4">Start a new certification to work towards your next certificate</p>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
                >
                  Explore Certifications
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {enrolledCertifications.in_progress.map((enrollment) => (
                  <div key={enrollment.id} className="card p-6">
                    <div className="mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{enrollment.certification.title}</h3>
                        <p className="text-gray-600 text-sm">Onliversity • {enrollment.certification.category}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{enrollment.progress}%</span>
                      </div>
                      <ProgressBar 
                        value={enrollment.progress} 
                        maxValue={100}
                        color="#2727E6"
                      />
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      Started on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </div>
                    
                    <button 
                      onClick={() => handleViewCertification(enrollment.certification_id)}
                      className="gradient-button text-white px-4 py-2 rounded-lg font-medium w-full"
                    >
                      Continue Learning
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explore Certifications */}
      {activeTab === 'explore' && (
        <div>
          {/* Search and Filter */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Icon name="magnifier-bold-duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search certifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2727E6] focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[#2727E6] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Certification Results */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredCertifications.length} {filteredCertifications.length === 1 ? 'certification' : 'certifications'}
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          {/* Certifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertifications.map((certification) => {
              const isEnrolled = [...enrolledCertifications.completed, ...enrolledCertifications.in_progress]
                .some(e => e.certification_id === certification.id);
              
              return (
                <div key={certification.id} className="card p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{certification.title}</h3>
                      <div className="bg-white px-2 py-1 rounded text-sm font-semibold text-green-600">
                        Free
                      </div>
                    </div>
                    {isEnrolled && (
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold inline-block mb-2">
                        Enrolled
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{certification.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Icon name="book-bookmark-bold-duotone" size={16} />
                      <span>{certification.modules_count} modules</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="clock-circle-bold-duotone" size={16} />
                      <span>{certification.estimated_hours} hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="target-bold-duotone" size={16} />
                      <span className="capitalize">{certification.difficulty}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Skills you'll gain:</h4>
                    <div className="flex flex-wrap gap-1">
                      {certification.skills?.slice(0, 3).map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                      {certification.skills && certification.skills.length > 3 && (
                        <span className="text-xs text-gray-500">+{certification.skills.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => isEnrolled 
                      ? handleViewCertification(certification.id)
                      : handleEnroll(certification.id)
                    }
                    disabled={isEnrolling && enrollingId === certification.id}
                    className="gradient-button text-white px-6 py-2 rounded-lg font-medium w-full flex items-center justify-center gap-2"
                  >
                    {isEnrolling && enrollingId === certification.id ? (
                      <>
                        <Icon name="spinner-bold-duotone" size={16} className="animate-spin" />
                        Enrolling...
                      </>
                    ) : isEnrolled ? (
                      <>
                        <Icon name="eye-bold-duotone" size={16} />
                        View Certification
                      </>
                    ) : (
                      <>
                        <Icon name="add-square-bold-duotone" size={16} />
                        Enroll Now
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* No Results */}
          {filteredCertifications.length === 0 && (
            <div className="text-center py-12">
              <div className="card p-8">
                <Icon name="magnifier-bold-duotone" size={64} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No certifications found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or browse different categories
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificate Benefits */}
      <div className="mt-12 card p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🏆 Certificate Benefits</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Professional Recognition</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Verifiable credentials from industry experts</li>
              <li>• LinkedIn integration for professional profiles</li>
              <li>• Employer recognition and career advancement</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Skill Validation</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Comprehensive skill assessment and verification</li>
              <li>• Portfolio of completed projects and achievements</li>
              <li>• Continuous learning progress tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCertifications;