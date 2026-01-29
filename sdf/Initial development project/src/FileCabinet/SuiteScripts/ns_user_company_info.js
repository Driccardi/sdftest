/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Custom Tool: User and Company Information
 * Retrieves current user's employee record and associated company/subsidiary details
 * for AI context when drafting emails or content.
 */
define(['N/runtime', 'N/record', 'N/file', 'N/log', 'N/cache'], 
  (runtime, record, file, log, cache) => {
    
    const LOG_PREFIX = 'USER_COMPANY_INFO';
    const CACHE_TTL = 3600; // 1 hour cache
    const MAX_DOC_LENGTH = 10000;

    /**
     * Main tool method - retrieves user and company information
     * No input parameters required
     */
    function getUserAndCompanyInfo(args) {
      try {
        const result = {
          success: true,
          user: null,
          company: null,
          errors: []
        };

        // Get current user
        const currentUser = runtime.getCurrentUser();
        const userId = currentUser.id;

        log.debug(`${LOG_PREFIX}`, `Loading info for user ${userId}`);

        // Load user employee record
        try {
          result.user = loadUserInfo(userId);
        } catch (e) {
          result.errors.push(`Failed to load user info: ${e.message}`);
          log.error(`${LOG_PREFIX}:loadUserInfo`, e.message);
        }

        // Load company info from subsidiary
        if (result.user && result.user.subsidiary && result.user.subsidiary.value) {
          try {
            result.company = loadCompanyInfo(result.user.subsidiary.value);
          } catch (e) {
            result.errors.push(`Failed to load company info: ${e.message}`);
            log.error(`${LOG_PREFIX}:loadCompanyInfo`, e.message);
          }
        } else {
          result.errors.push('No subsidiary found for user');
        }

        // Set success to false if we have no data at all
        if (!result.user && !result.company) {
          result.success = false;
        }

        return JSON.stringify(result);

      } catch (e) {
        log.error(`${LOG_PREFIX}:getUserAndCompanyInfo`, e.message);
        return JSON.stringify({
          success: false,
          error: e.message
        });
      }
    }

    /**
     * Load employee record fields for current user
     */
    function loadUserInfo(userId) {
      const empRecord = record.load({
        type: record.Type.EMPLOYEE,
        id: userId,
        isDynamic: false
      });

      return {
        email: getFieldValueText(empRecord, 'email'),
        mobilephone: getFieldValueText(empRecord, 'mobilephone'),
        phone: getFieldValueText(empRecord, 'phone'),
        firstname: getFieldValueText(empRecord, 'firstname'),
        lastname: getFieldValueText(empRecord, 'lastname'),
        entityid: getFieldValueText(empRecord, 'entityid'),
        title: getFieldValueText(empRecord, 'title'),
        supervisor: getFieldValueText(empRecord, 'supervisor'),
        defaultaddress: getFieldValueText(empRecord, 'defaultaddress'),
        subsidiary: getFieldValueText(empRecord, 'subsidiary'),
        location: getFieldValueText(empRecord, 'location')
      };
    }

    /**
     * Load subsidiary record and associated documents with caching
     */
    function loadCompanyInfo(subsidiaryId) {
      const companyCache = cache.getCache({
        name: 'company_info_cache',
        scope: cache.Scope.PROTECTED
      });

      const cacheKey = `sub_${subsidiaryId}`;
      let cached = companyCache.get({ key: cacheKey });

      if (cached) {
        log.debug(`${LOG_PREFIX}`, `Using cached company info for subsidiary ${subsidiaryId}`);
        return JSON.parse(cached);
      }

      const subRecord = record.load({
        type: record.Type.SUBSIDIARY,
        id: subsidiaryId,
        isDynamic: false
      });

      const companyInfo = {
        name: getFieldValueText(subRecord, 'name'),
        email: getFieldValueText(subRecord, 'email'),
        currency: getFieldValueText(subRecord, 'currency'),
        url: getFieldValueText(subRecord, 'url'),
        dropdownstate: getFieldValueText(subRecord, 'dropdownstate'),
        country: getFieldValueText(subRecord, 'country'),
        mainaddress_text: getFieldValueText(subRecord, 'mainaddress_text'),
        shippingaddress_text: getFieldValueText(subRecord, 'shippingaddress_text'),
        returnaddress_text: getFieldValueText(subRecord, 'returnaddress_text'),
        logoURL: null
      };

      // Get logo URL if exists
      const logoId = subRecord.getValue({ fieldId: 'logo' });
      if (logoId) {
        try {
          const logoFile = file.load({ id: logoId });
          companyInfo.logoURL = logoFile.url;
        } catch (e) {
          log.error(`${LOG_PREFIX}:loadLogo`, `Failed to load logo: ${e.message}`);
        }
      }

      // Load brand documents
      const brandGuideId = subRecord.getValue({ fieldId: 'custrecord_ns_ai_brandguide' });
      if (brandGuideId) {
        companyInfo['brand-guide'] = loadDocumentContent(brandGuideId, 'brand-guide');
      }

      const companyOverviewId = subRecord.getValue({ fieldId: 'custrecord_ns_ai_companydoc' });
      if (companyOverviewId) {
        companyInfo['company-overview'] = loadDocumentContent(companyOverviewId, 'company-overview');
      }

      const vocabularyId = subRecord.getValue({ fieldId: 'custrecord_ns_ai_vocabulary' });
      if (vocabularyId) {
        companyInfo['vocabulary'] = loadDocumentContent(vocabularyId, 'vocabulary');
      }

      // Cache the result
      companyCache.put({
        key: cacheKey,
        value: JSON.stringify(companyInfo),
        ttl: CACHE_TTL
      });

      return companyInfo;
    }

    /**
     * Load and cache document content
     */
    function loadDocumentContent(fileId, docType) {
      const docCache = cache.getCache({
        name: 'doc_content_cache',
        scope: cache.Scope.PROTECTED
      });

      const cacheKey = `doc_${fileId}`;
      let cached = docCache.get({ key: cacheKey });

      if (cached) {
        log.debug(`${LOG_PREFIX}`, `Using cached content for ${docType} (file ${fileId})`);
        return cached;
      }

      try {
        const docFile = file.load({ id: fileId });
        let content = docFile.getContents();

        // Truncate if necessary
        if (content.length > MAX_DOC_LENGTH) {
          content = content.substring(0, MAX_DOC_LENGTH) + '\n[TRUNCATED]';
          log.debug(`${LOG_PREFIX}`, `Truncated ${docType} from ${docFile.size} to ${MAX_DOC_LENGTH} chars`);
        }

        // Cache the content
        docCache.put({
          key: cacheKey,
          value: content,
          ttl: CACHE_TTL
        });

        return content;

      } catch (e) {
        log.error(`${LOG_PREFIX}:loadDocument`, `Failed to load ${docType} (file ${fileId}): ${e.message}`);
        return null;
      }
    }

    /**
     * Helper to get both value and text for a field
     */
    function getFieldValueText(record, fieldId) {
      try {
        const value = record.getValue({ fieldId: fieldId });
        const text = record.getText({ fieldId: fieldId });
        
        return {
          value: value !== null && value !== '' ? value : null,
          text: text !== null && text !== '' ? text : null
        };
      } catch (e) {
        // Field doesn't exist or no access
        return { value: null, text: null };
      }
    }

    // Export tool method
    return {
      getUserAndCompanyInfo
    };
  });