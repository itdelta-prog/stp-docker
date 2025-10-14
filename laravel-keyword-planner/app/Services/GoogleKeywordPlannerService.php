<?php

namespace App\Services;

use Exception;
use Google\Ads\GoogleAds\Lib\OAuth2TokenBuilder;
use Google\Ads\GoogleAds\Lib\V21\GoogleAdsClient;
use Google\Ads\GoogleAds\Util\V21\ResourceNames;
use Google\Ads\GoogleAds\Lib\V21\GoogleAdsClientBuilder;
use Google\Ads\GoogleAds\V21\Services\GenerateKeywordHistoricalMetricsRequest;
use Google\Ads\GoogleAds\V21\Services\GenerateKeywordHistoricalMetricsResult;
use Google\Ads\GoogleAds\V21\Enums\KeywordPlanCompetitionLevelEnum\KeywordPlanCompetitionLevel;
use Google\Ads\GoogleAds\V21\Enums\KeywordPlanNetworkEnum\KeywordPlanNetwork;
use Google\Ads\GoogleAds\V21\Enums\MonthOfYearEnum\MonthOfYear;
use Google\Ads\GoogleAds\V21\Common\MonthlySearchVolume;
use Google\Ads\GoogleAds\V21\Services\CreateCustomerClientRequest;
use Google\Ads\GoogleAds\V21\Services\ListAccessibleCustomersRequest;
use Google\Ads\GoogleAds\V21\Resources\Customer;

class GoogleKeywordPlannerService
{
    public function googleAdsClient(): GoogleAdsClient
    {
        $oAuth2Credential = (new OAuth2TokenBuilder())->fromFile(public_path('google_ads_php.ini'))->build();
        $googleAdsClient = (new GoogleAdsClientBuilder())->fromFile()
            ->withOAuth2Credential($oAuth2Credential)
            ->build();

        return $googleAdsClient;
    }


    public function keywordPlanIdeaServiceClient()
    {
        return $this->googleAdsClient()->getKeywordPlanIdeaServiceClient();
    }

    public function listCustomers() {
        $customerService = $this->googleAdsClient()->getCustomerServiceClient();
        $accesssibleCustomers = $customerService->listAccessibleCustomers(new ListAccessibleCustomersRequest());
        // Iterates over all accessible customers' resource names and prints them.
        $names = [];
        foreach ($accesssibleCustomers->getResourceNames() as $resourceName) {
            /** @var string $resourceName */
            $names[] = $resourceName;
        }
        return $names;
    }


    public function createCustomer(array $data): string
    {
        $customer = new Customer([
            'descriptive_name' => $data['descriptive_name'] . date('Ymd h:i:s'),
            // For a list of valid currency codes and time zones see this documentation:
            // https://developers.google.com/google-ads/api/reference/data/codes-formats.
            'currency_code' => 'CZK',
            'time_zone' => 'Europe/Prague',
            // The below values are optional. For more information about URL
            // options see: https://support.google.com/google-ads/answer/6305348.
            // 'tracking_url_template' => '{lpurl}?device={device}',
            // 'final_url_suffix' => 'keyword={keyword}&matchtype={matchtype}&adgroupid={adgroupid}'
        ]);
        $managerCustomerId = config('services.google-ads.login_customer_id', null);
        if(!$managerCustomerId)
            throw new Exception('manager customer id is null!');
        // Issues a mutate request to create an account
        $customerServiceClient = $this->googleAdsClient()->getCustomerServiceClient();
        $response = $customerServiceClient->createCustomerClient(
            CreateCustomerClientRequest::build($managerCustomerId, $customer)
        );

        $res = sprintf(
            'Created a customer with resource name "%s" under the manager account with '
            . 'customer ID %s',
            $response->getResourceName(),
            $managerCustomerId,
        );

        return $res;
    }


    public function generateKeywordHistoricalMetricsRequest(int $customer_id, array $keywords = [])
    {
        return new GenerateKeywordHistoricalMetricsRequest([
            'customer_id' => $customer_id,
            'keywords' => $keywords,
            // See https://developers.google.com/google-ads/api/reference/data/geotargets for
            // the list of geo target IDs.
            // Geo target constant 2840 is for USA.
            'geo_target_constants' => [ResourceNames::forGeoTargetConstant(2203)],
            'keyword_plan_network' => KeywordPlanNetwork::GOOGLE_SEARCH,
            // https://developers.google.com/google-ads/api/reference/data/codes-formats#languages
            // for the list of language constant IDs.
            // Language constant 1000 is for English.
            'language' => ResourceNames::forLanguageConstant(1021)
        ]);
    }


    public function generateKeywordHistoricalMetrics(int $customer_id, array $keywords = [])
    {
        $response = $this->keywordPlanIdeaServiceClient()->generateKeywordHistoricalMetrics($this->generateKeywordHistoricalMetricsRequest($customer_id, $keywords));
        // Iterates over the results and print its detail.
        foreach ($response->getResults() as $result) {
            /** @var GenerateKeywordHistoricalMetricsResult $result */

            $metrics = $result->getKeywordMetrics();

            $search_query = $result->getText();
            $search_query_variants = implode(',', iterator_to_array($result->getCloseVariants()->getIterator()));

            // Approximate number of monthly searches on this query averaged for the past 12 months.
            $approximate_avg_monthly_searches = $metrics->hasAvgMonthlySearches()
                ? sprintf("%d", $metrics->getAvgMonthlySearches())
                : "'none'";

            // The competition level for this search query.
            $competition_level = KeywordPlanCompetitionLevel::name($metrics->getCompetition());

            // The competition index for the query in the range [0,100]. This shows how
            // competitive ad placement is for a keyword. The level of competition from 0-100 is
            // determined by the number of ad slots filled divided by the total number of slots
            // available. If not enough data is available, null will be returned.
            $competition_index =
                $metrics->hasCompetitionIndex()
                ? sprintf("%d", $metrics->getCompetitionIndex())
                : "'none'";

            // Top of page bid low range (20th percentile) in micros for the keyword.
            $percentile_20th = $metrics->hasLowTopOfPageBidMicros()
                ? sprintf("%d", $metrics->getLowTopOfPageBidMicros())
                : "'none'";

            // Top of page bid high range (80th percentile) in micros for the keyword.
            $percentile_80th = $metrics->hasHighTopOfPageBidMicros()
                ? sprintf("%d", $metrics->getHighTopOfPageBidMicros())
                : "'none'";

            // Approximate number of searches on this query for the past twelve months.
            $monthlySearchVolumes =
                iterator_to_array($metrics->getMonthlySearchVolumes()->getIterator());
            usort(
                $monthlySearchVolumes,
                // Orders the monthly search volumes by descending year, then descending month.
                function (MonthlySearchVolume $volume1, MonthlySearchVolume $volume2) {
                    $yearsCompared = $volume2->getYear() <=> $volume1->getYear();
                    if ($yearsCompared != 0) {
                        return $yearsCompared;
                    } else {
                        return $volume2->getMonth() <=> $volume1->getMonth();
                    }
                }
            );

            $monthly_search_volumes_data = array_map(function (MonthlySearchVolume $monthlySearchVolume) {
                return [
                    'monthly_search_volume' => $monthlySearchVolume->getMonthlySearches(),
                    'month_of_year' => MonthOfYear::name($monthlySearchVolume->getMonth()),
                    'year' =>  $monthlySearchVolume->getYear(),

                ];
            }, $monthlySearchVolumes);

            return compact(
                'search_query',
                'search_query_variants',
                'approximate_avg_monthly_searches',
                'competition_level',
                'competition_index',
                'percentile_20th',
                'percentile_80th',
                'monthly_search_volumes_data',
            );
        }
    }
}
